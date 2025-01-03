import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectButton } from "arweave-wallet-kit";
import { useConnection, useActiveAddress } from "arweave-wallet-kit";
import { useEffect } from "react";
import useDeployment from "@/hooks/useDeployment";
import { TDeployment } from "@/types/types";
import { Link } from "react-router-dom";

export default function CheckEligibility() {
    const { connected } = useConnection();
    const address = useActiveAddress();
    const { managerProcess, deployments, refresh } = useDeployment();
  
    useEffect(() => {
      if (connected && address) {
        refresh();
      }
    }, [connected, address, refresh]);

    return (
        <div className="container mx-auto mt-10 px-4">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Check Airdrop Eligibility</CardTitle>
              <CardDescription>
                Connect your wallet to check if you're eligible for the airdrop
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center mb-8">
                <ConnectButton />
              </div>
              
              {connected && deployments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deployments.map((deployment: TDeployment) => (
                    <Link 
                      to={`/deployment?repo=${deployment.Name}`}
                      key={deployment.ID}
                      className="block"
                    >
                      <div className="group relative p-4 rounded-lg border border-zinc-800 transition-colors duration-200 
                          hover:border-slate-400 bg-black">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-8 h-8 rounded-md" style={{
                              background: 'linear-gradient(to bottom right, #00ff00, #32cd32, #98fb98, #00fa9a, #00bfff, #ffd700)'
                            }}></div>
                            <div className="overflow-hidden">
                              <h3 className="font-semibold truncate text-zinc-200">{deployment.Name}</h3>
                              <p className="text-sm text-zinc-400 truncate">{deployment.RepoUrl}</p>
                            </div>
                          </div>
                          <p className="text-sm text-zinc-400 truncate">
                            {deployment.RepoUrl.split('/').slice(-2).join('/')}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {connected && deployments.length === 0 && (
                <div className="text-center text-zinc-400">
                  No deployments found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    );
} 