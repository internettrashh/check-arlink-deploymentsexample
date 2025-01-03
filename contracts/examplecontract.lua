-- Initialize JSON module for handling responses
json = require('json')

-- Initialize SQLite database
db = require"lsqlite3".open_memory()


-- Create tables if they don't exist
db:exec[[
    CREATE TABLE IF NOT EXISTS WalletManagers (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        WalletAddress TEXT NOT NULL UNIQUE,
        ManagerProcess TEXT NOT NULL UNIQUE,
        DeploymentCount INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS Deployments (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        WalletAddress TEXT NOT NULL,
        DeploymentId TEXT NOT NULL UNIQUE,
        FOREIGN KEY(WalletAddress) REFERENCES WalletManagers(WalletAddress)
    );
]]

-- Initialize handlers table
Handlers = Handlers or {}
PendingRegistrations = PendingRegistrations or {}

-- Handler to register new wallet-manager pair
Handlers.add(
    "RegisterManager",
    Handlers.utils.hasMatchingTag("Action", "RegisterManager"),
    function(msg)
        assert(msg.Tags.WalletAddress, "WalletAddress tag is required")
        assert(msg.Tags.ManagerProcess, "ManagerProcess tag is required")
        
        print("Attempting to register wallet: " .. msg.Tags.WalletAddress)
        print("With manager process: " .. msg.Tags.ManagerProcess)
        
        -- Store in pending registrations
        PendingRegistrations[msg.Tags.ManagerProcess] = {
            wallet = msg.Tags.WalletAddress,
            requester = msg.From,
            timestamp = os.time()
        }

        -- Request deployments from manager process
        print("Requesting deployments from: " .. msg.Tags.ManagerProcess)
        ao.send({
            Target = msg.Tags.ManagerProcess,
            Action = "ARlink.GetDeployments"
        })
    end
)

-- Add new handler for processing deployment responses
Handlers.add(
    "ProcessDeployments",
    function(msg)
        if not PendingRegistrations[msg.From] then
            return false
        end
        return msg.Data ~= nil and msg.Action == nil
    end,
    function(msg)
        local pending = PendingRegistrations[msg.From]
        print("Received deployment response from: " .. msg.From)
        
        -- FIRST: Insert the wallet-manager pair
        local success, err = pcall(function()
            db:exec(string.format([[
                INSERT INTO WalletManagers (WalletAddress, ManagerProcess, DeploymentCount)
                VALUES ('%s', '%s', 0)
            ]], pending.wallet, msg.From))
        end)

        if not success then
            print("Error registering wallet-manager pair: " .. tostring(err))
            ao.send({
                Target = pending.requester,
                Action = "RegisterResponse",
                Status = "Error",
                Data = "Registration failed - Database error"
            })
            PendingRegistrations[msg.From] = nil
            return
        end

        print("Successfully registered wallet-manager pair")
        
        -- THEN: Process deployments
        local success, deployments = pcall(json.decode, msg.Data)
        if success then
            local processed_ids = {}  -- Track unique IDs
            local count = 0
            
            for _, deployment in ipairs(deployments) do
                if deployment.DeploymentId and deployment.DeploymentId ~= "" then
                    -- Only process if we haven't seen this ID before
                    if not processed_ids[deployment.DeploymentId] then
                        processed_ids[deployment.DeploymentId] = true
                        
                        local success, err = pcall(function()
                            db:exec(string.format([[
                                INSERT OR IGNORE INTO Deployments (WalletAddress, DeploymentId)
                                VALUES ('%s', '%s')
                            ]], pending.wallet, deployment.DeploymentId))
                        end)
                        if success then
                            count = count + 1
                            print("Added unique deployment ID: " .. deployment.DeploymentId)
                        end
                    end
                end
            end

            -- Update deployment count
            db:exec(string.format([[
                UPDATE WalletManagers 
                SET DeploymentCount = %d
                WHERE WalletAddress = '%s'
            ]], count, pending.wallet))

            print(string.format("Processed %d unique deployments for wallet %s", count, pending.wallet))
            
            ao.send({
                Target = pending.requester,
                Action = "RegisterResponse",
                Status = "Success",
                Data = string.format("Registration successful. Processed %d unique deployments", count)
            })
        else
            print("Failed to parse deployments response")
            ao.send({
                Target = pending.requester,
                Action = "RegisterResponse",
                Status = "Error",
                Data = "Invalid deployment data received"
            })
        end

        -- Clean up pending registration
        PendingRegistrations[msg.From] = nil
    end
)

-- Handler to query database contents
Handlers.add(
    "GetStats",
    Handlers.utils.hasMatchingTag("Action", "GetStats"),
    function(msg)
        print("Processing GetStats request")
        
        -- First, let's debug what's in our tables
        print("Current WalletManagers entries:")
        for row in db:nrows("SELECT * FROM WalletManagers") do
            print(string.format("Wallet: %s, Manager: %s, Count: %d", 
                row.WalletAddress, row.ManagerProcess, row.DeploymentCount))
        end

        print("Current Deployments entries:")
        for row in db:nrows("SELECT * FROM Deployments") do
            print(string.format("Wallet: %s, DeploymentId: %s", 
                row.WalletAddress, row.DeploymentId))
        end
        
        local stats = {
            wallets = {},
            total_deployments = 0
        }

        -- Simplified query to ensure we're getting all wallets
        for row in db:nrows[[
            SELECT 
                WalletAddress, 
                ManagerProcess, 
                DeploymentCount
            FROM WalletManagers
        ]] do
            table.insert(stats.wallets, {
                wallet = row.WalletAddress,
                manager = row.ManagerProcess,
                deployment_count = row.DeploymentCount
            })
            stats.total_deployments = stats.total_deployments + row.DeploymentCount
        end

        print("Found " .. #stats.wallets .. " wallets in database")
        
        ao.send({
            Target = msg.From,
            Action = "StatsResponse",
            Data = json.encode(stats)
        })
    end
)
-- Add a GetWallets handler
Handlers.add(
    "GetWallets",
    Handlers.utils.hasMatchingTag("Action", "GetWallets"),
    function(msg)
        print("Processing GetWallets request")
        
        local wallets = {
            wallets = {},
            total_wallets = 0
        }

        for row in db:nrows[[
            SELECT 
                WalletAddress, 
                DeploymentCount 
            FROM WalletManagers
        ]] do
            table.insert(wallets.wallets, {
                wallet = row.WalletAddress,
                deployments = row.DeploymentCount
            })
            wallets.total_wallets = wallets.total_wallets + 1
        end

        print(string.format("Found %d wallets", wallets.total_wallets))
        
        ao.send({
            Target = msg.From,
            Action = "WalletsResponse",
            Data = json.encode(wallets)
        })
    end
)