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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('knowledge-base')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Extract text based on file type
    const fileName = filePath.split('/').pop() || ''
    const fileExtension = fileName.toLowerCase().split('.').pop()
    let extractedText = ''

    if (fileExtension === 'txt' || fileExtension === 'md') {
      extractedText = await fileData.text()
    } else if (fileExtension === 'pdf') {
      // For PDF processing, we'd need a PDF library like pdf-parse
      // For now, we'll simulate text extraction
      extractedText = "PDF text extraction would be implemented here with a PDF parsing library."
    } else if (fileExtension === 'docx') {
      // For DOCX processing, we'd need a library like mammoth
      extractedText = "DOCX text extraction would be implemented here with a DOCX parsing library."
    } else {
      extractedText = await fileData.text()
    }

    console.log(`Extracted ${extractedText.length} characters from ${fileName}`)

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
        }
      })
    }

    // Insert all chunks
    const { error: insertError } = await supabaseClient
      .from('knowledge_base_chunks')
      .insert(chunksToInsert)

    if (insertError) {
      throw new Error(`Failed to insert chunks: ${insertError.message}`)
    }

    // Update document status to completed
    const { error: updateError } = await supabaseClient
      .from('knowledge_base_documents')
      .update({ status: 'completed' })
      .eq('id', documentId)

    if (updateError) {
      throw new Error(`Failed to update document status: ${updateError.message}`)
    }

    console.log(`Successfully processed document ${documentId} with ${chunks.length} chunks`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksCreated: chunks.length,
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
      const { documentId } = await req.clone().json()
      if (documentId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )
        
        await supabaseClient
          .from('knowledge_base_documents')
          .update({ status: 'failed' })
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
