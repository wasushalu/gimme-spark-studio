import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documentId, filePath, agentId } = await req.json()
    console.log(`Processing document: ${documentId}, file: ${filePath}, agent: ${agentId}`)

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('knowledge-base')
      .download(filePath)

    if (downloadError) {
      console.error('Download error:', downloadError)
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    console.log(`Downloaded file size: ${fileData.size} bytes`)

    // Extract text based on file type
    const fileName = filePath.split('/').pop() || ''
    const fileExtension = fileName.toLowerCase().split('.').pop()
    let extractedText = ''

    console.log(`Processing file: ${fileName}, extension: ${fileExtension}`)

    if (fileExtension === 'txt' || fileExtension === 'md') {
      extractedText = await fileData.text()
    } else if (fileExtension === 'pdf') {
      // For now, we'll use a basic PDF text extraction approach
      // In a production environment, you'd want to use a proper PDF library
      try {
        const arrayBuffer = await fileData.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        
        // Simple PDF text extraction (this is basic and may not work for all PDFs)
        // For production, consider using a proper PDF parsing library
        const text = new TextDecoder().decode(uint8Array)
        
        // Extract readable text from PDF (very basic approach)
        const textMatches = text.match(/BT\s*\/\w+\s+\d+\s+Tf\s*(.+?)\s*ET/g)
        if (textMatches) {
          extractedText = textMatches.map(match => {
            return match.replace(/BT\s*\/\w+\s+\d+\s+Tf\s*/, '').replace(/\s*ET/, '')
          }).join(' ')
        }
        
        // Fallback: try to extract any readable text
        if (!extractedText) {
          const readableTextRegex = /[a-zA-Z0-9\s.,!?;:'"()[\]{}\-+=@#$%^&*|\\/<>~`]+/g
          const matches = text.match(readableTextRegex)
          if (matches) {
            extractedText = matches.filter(m => m.length > 10).join(' ')
          }
        }
        
        // If still no text, provide a message
        if (!extractedText || extractedText.trim().length < 10) {
          extractedText = `PDF document uploaded: ${fileName}. Content could not be automatically extracted. Please consider converting to text format for better searchability.`
        }
        
        console.log(`Extracted ${extractedText.length} characters from PDF`)
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError)
        extractedText = `PDF document uploaded: ${fileName}. Text extraction failed. Please consider uploading as text format.`
      }
    } else if (fileExtension === 'docx') {
      // For DOCX, we'll provide a placeholder and suggestion
      extractedText = `DOCX document uploaded: ${fileName}. For best results, please copy and paste the content as text or convert to PDF.`
    } else {
      // Try to read as text for any other format
      try {
        extractedText = await fileData.text()
      } catch (error) {
        console.error('Error reading file as text:', error)
        extractedText = `Document uploaded: ${fileName}. Content type not fully supported. Please consider converting to text format.`
      }
    }

    // Ensure we have some content
    if (!extractedText || extractedText.trim().length === 0) {
      extractedText = `Document uploaded: ${fileName}. No text content could be extracted.`
    }

    console.log(`Final extracted text length: ${extractedText.length} characters`)

    // Chunk the text using best practices
    const chunks = chunkText(extractedText, {
      chunkSize: 300,
      chunkOverlap: 50,
      preserveSentences: true
    })

    console.log(`Created ${chunks.length} chunks`)

    // Generate embeddings and store chunks
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const chunksToInsert = []
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      console.log(`Processing chunk ${i + 1}/${chunks.length}`)
      
      // Generate embedding using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-ada-002',
          input: chunk.content,
        }),
      })

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text()
        console.error('Embedding API error:', errorText)
        throw new Error(`Failed to generate embedding: ${embeddingResponse.statusText}`)
      }

      const embeddingData = await embeddingResponse.json()
      const embedding = embeddingData.data[0].embedding

      chunksToInsert.push({
        document_id: documentId,
        agent_id: agentId,
        chunk_index: i,
        content: chunk.content,
        word_count: chunk.wordCount,
        char_count: chunk.charCount,
        embedding: embedding,
        metadata: {
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
          fileName: fileName,
          fileExtension: fileExtension,
        }
      })
    }

    console.log(`Inserting ${chunksToInsert.length} chunks`)

    // Insert all chunks
    const { error: insertError } = await supabaseClient
      .from('knowledge_base_chunks')
      .insert(chunksToInsert)

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to insert chunks: ${insertError.message}`)
    }

    // Update document status to completed
    const { error: updateError } = await supabaseClient
      .from('knowledge_base_documents')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error(`Failed to update document status: ${updateError.message}`)
    }

    console.log(`Successfully processed document ${documentId} with ${chunks.length} chunks`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksCreated: chunks.length,
        extractedTextLength: extractedText.length,
        message: 'Document processed successfully'
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('Document processing error:', error)

    // Update document status to failed if we have the documentId
    try {
      const body = await req.clone().text()
      const { documentId } = JSON.parse(body)
      
      if (documentId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        await supabaseClient
          .from('knowledge_base_documents')
          .update({ 
            status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId)
      }
    } catch (updateError) {
      console.error('Failed to update document status to failed:', updateError)
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )
  }
})

interface ChunkOptions {
  chunkSize: number
  chunkOverlap: number
  preserveSentences: boolean
}

interface TextChunk {
  content: string
  wordCount: number
  charCount: number
  startIndex: number
  endIndex: number
}

function chunkText(text: string, options: ChunkOptions): TextChunk[] {
  const { chunkSize, chunkOverlap, preserveSentences } = options
  const chunks: TextChunk[] = []
  
  if (!text || text.trim().length === 0) {
    return chunks
  }

  // Clean and normalize the text
  const cleanedText = text.replace(/\s+/g, ' ').trim()
  
  if (preserveSentences) {
    // Split by sentences for better semantic coherence
    const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    let currentChunk = ''
    let currentWordCount = 0
    let startIndex = 0
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.trim().split(/\s+/).length
      
      // If adding this sentence would exceed the chunk size, save current chunk
      if (currentWordCount + sentenceWords > chunkSize && currentChunk.length > 0) {
        const chunk: TextChunk = {
          content: currentChunk.trim(),
          wordCount: currentWordCount,
          charCount: currentChunk.trim().length,
          startIndex: startIndex,
          endIndex: startIndex + currentChunk.trim().length
        }
        chunks.push(chunk)
        
        // Handle overlap by keeping some words from the end of the current chunk
        if (chunkOverlap > 0) {
          const words = currentChunk.trim().split(/\s+/)
          const overlapWords = words.slice(-Math.min(chunkOverlap, words.length))
          currentChunk = overlapWords.join(' ') + ' '
          currentWordCount = overlapWords.length
        } else {
          currentChunk = ''
          currentWordCount = 0
        }
        
        startIndex = chunks[chunks.length - 1].endIndex
      }
      
      currentChunk += sentence.trim() + '. '
      currentWordCount += sentenceWords
    }
    
    // Add the last chunk if it has content
    if (currentChunk.trim().length > 0) {
      const chunk: TextChunk = {
        content: currentChunk.trim(),
        wordCount: currentWordCount,
        charCount: currentChunk.trim().length,
        startIndex: startIndex,
        endIndex: startIndex + currentChunk.trim().length
      }
      chunks.push(chunk)
    }
  } else {
    // Simple word-based chunking
    const words = cleanedText.split(/\s+/)
    
    for (let i = 0; i < words.length; i += chunkSize - chunkOverlap) {
      const chunkWords = words.slice(i, i + chunkSize)
      const content = chunkWords.join(' ')
      
      const chunk: TextChunk = {
        content: content,
        wordCount: chunkWords.length,
        charCount: content.length,
        startIndex: i,
        endIndex: i + chunkWords.length
      }
      chunks.push(chunk)
      
      // Break if we've processed all words
      if (i + chunkSize >= words.length) {
        break
      }
    }
  }
  
  return chunks
}
