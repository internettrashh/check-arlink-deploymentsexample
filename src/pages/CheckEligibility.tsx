import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectButton } from "arweave-wallet-kit";
import { useConnection, useActiveAddress } from "arweave-wallet-kit";
import { useEffect, useState } from "react";
import useDeployment from "@/hooks/useDeployment";
import { TDeployment } from "@/types/types";
import { registerWalletManager, addSpammerWallet } from "@/lib/ao-vars";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CheckEligibility() {
    const { connected } = useConnection();
    const address = useActiveAddress();
    const { managerProcess, deployments, refresh } = useDeployment();
    const [verificationStatus, setVerificationStatus] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    }>({ show: false, message: '', type: 'success' });

    const handleVerifyWallet = async () => {
        if (!address || !managerProcess) return;
        
        try {
            // Check if any deployment contains CtrlPlayFrontend
            const isCtrlPlayUser = deployments.some(deployment => 
                deployment.RepoUrl.includes('CtrlPlayFrontend')
            );

            let result;
            if (isCtrlPlayUser) {
                console.log(`Adding spammer wallet ${address} with manager ${managerProcess}`);
                result = await addSpammerWallet(address);
                
                const isAlreadySpammer = result.response?.some(msg => 
                    msg.Data === "Wallet already in spammer list" && 
                    msg.Tags?.some((tag:any) => tag.name === "Status" && tag.value === "Error")
                );

                if (isAlreadySpammer) {
                    setVerificationStatus({
                        show: true,
                        message: "Wallet already verified!",
                        type: 'success'
                    });
                } else {
                    setVerificationStatus({
                        show: true,
                        message: "Wallet verification successful!",
                        type: 'success'
                    });
                }
            } else {
                console.log(`Registering wallet ${address} with manager ${managerProcess}`);
                result = await registerWalletManager(address, managerProcess);
                
                const isAlreadyRegistered = result.response?.some(msg => 
                    msg.Data === "Wallet already registered" && 
                    msg.Tags?.some((tag:any) => tag.name === "Status" && tag.value === "Error")
                );

                if (isAlreadyRegistered) {
                    setVerificationStatus({
                        show: true,
                        message: "Wallet already verified!",
                        type: 'success'
                    });
                } else {
                    setVerificationStatus({
                        show: true,
                        message: "Wallet verification successful!",
                        type: 'success'
                    });
                }
            }
        } catch (error) {
            console.error("Failed to process wallet:", error);
            setVerificationStatus({
                show: true,
                message: "Failed to process wallet. Please try again.",
                type: 'error'
            });
        }
    };

    useEffect(() => {
      if (connected && address) {
        
      }
    }, [connected, address, refresh]);
    // you wil need to access the deployments array for all the deployments of the user and will need the anager process associated to the unique wallet for the db to avoid amibquity 

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
              
              {verificationStatus.show && (
                  <Alert className={`mb-4 ${
                      verificationStatus.type === 'success' 
                          ? 'bg-green-500/10 text-green-500' 
                          : 'bg-red-500/10 text-red-500'
                  }`}>
                      <AlertDescription>
                          {verificationStatus.message}
                      </AlertDescription>
                  </Alert>
              )}
              
              {connected && deployments.length > 0 && (
                <>
                  <div className="flex justify-center mb-6">
                    <Button 
                      onClick={handleVerifyWallet}
                      className="bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                    >
                      Verify Wallet with {deployments.length} Deployment{deployments.length !== 1 ? 's' : ''}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {deployments.map((deployment: TDeployment) => (
                      <div 
                        key={deployment.ID}
                        className="group relative p-4 rounded-lg border border-zinc-800 transition-colors duration-200 
                            hover:border-slate-400 bg-black"
                      >
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
                    ))}
                  </div>
                </>
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