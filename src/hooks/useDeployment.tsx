import { useEffect } from "react";
import { useGlobalState } from "@/hooks/useGlobalstate";
import { useActiveAddress, useConnection } from "arweave-wallet-kit";

import { connect } from "@permaweb/aoconnect";
import { gql, GraphQLClient } from "graphql-request";
export default function useDeploymentManager() {
    const globalState = useGlobalState();
    const { connected } = useConnection();
    const address = useActiveAddress();
    //@ts-ignore
    const ao = connect()

    useEffect(() => {
        if (connected && address) {
            getManagerProcessFromAddress(address).then((id) => {
                if (id) {
                    console.log("deployment manager id", id);
                    globalState.setManagerProcess(id);
                } else {
                    console.log("No manager process found");
                      //@ts-ignore
                    alert("No manager process found, you are not eligible ");
                  
                }
            })
        }
    }, [connected, address])
   

    useEffect(() => {
        refresh();
    }, [globalState.managerProcess])

    async function refresh() {
        if (!globalState.managerProcess) return

        console.log("fetching deployments")

        const result = await connect().dryrun({
            process: globalState.managerProcess,
            tags: [{ name: "Action", value: "ARlink.GetDeployments" }],
            Owner: address
        })

        try {
            if (result.Error) return alert(result.Error)
            console.log("result", result)
            const { Messages } = result
            const deployments = JSON.parse(Messages[0].Data)
            console.log("deployments", deployments)
            globalState.setDeployments(deployments)
        }
        catch {
            
            await refresh()
        }

    }

    return {
        managerProcess: globalState.managerProcess,
        deployments: globalState.deployments,
        refresh
    }
}
// keep it as local host if NODE_ENV is test



export async function getManagerProcessFromAddress(address: string) {
  const client = new GraphQLClient("https://arweave-search.goldsky.com/graphql");

  const query = gql`
  query {
  transactions(
    owners: ["${address}"]
    tags: [
      { name: "App-Name", values: ["ARlink"] }
      { name: "Name", values: ["ARlink-Manager"] }
    ]
  ) {
    edges {
      node {
        id
      }
    }
  }
}`;

  type response = {
    transactions: {
      edges: {
        node: {
          id: string;
        };
      }[];
    };
  };

  const data: response = await client.request(query);
  return data.transactions.edges.length > 0
    ? data.transactions.edges[0].node.id
    : null;
}
