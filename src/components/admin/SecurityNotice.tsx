
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SecurityNotice() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Notice</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          All API keys are securely encrypted and stored using Supabase Secrets. 
          Keys are never exposed in your application code or logs. 
          Only authorized edge functions can access these keys when needed.
        </p>
      </CardContent>
    </Card>
  );
}
