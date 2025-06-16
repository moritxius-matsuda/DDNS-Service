import { SignedIn, UserButton } from "@clerk/nextjs";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";

export default function Dashboard() {
  const [hostname, setHostname] = useState("");
  const [ipAddress, setIpAddress] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostname || !ipAddress) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hostname, ipAddress }),
      });

      if (!response.ok) {
        throw new Error("Failed to update DDNS record");
      }

      toast.success("DDNS record updated successfully");
      setHostname("");
      setIpAddress("");
    } catch (error) {
      toast.error("Failed to update DDNS record");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">DDNS Management</h1>
        
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                placeholder="mydevice.dm1lx.de"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                placeholder="192.168.1.100"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            
            <Button type="submit">Update DDNS Record</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
