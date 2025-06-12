
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold gradient-text">Gimmefy</h1>
        <p className="text-muted-foreground text-lg">
          AI Marketing Studio
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => navigate('/chat')} 
            className="w-full"
            size="lg"
          >
            Start Chat
          </Button>
          <Button 
            onClick={() => navigate('/admin')} 
            variant="outline"
            className="w-full"
            size="lg"
          >
            Admin Panel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
