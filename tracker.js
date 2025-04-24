const walletAddress = "9uo3TB4a8synap9VMNpby6nzmnMs9xJWmgo2YKJHZWVn";
const solscanApiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NDU0MzcwNzcxNzcsImVtYWlsIjoibHVrYXMuZ2FzdGxAaWNsb3VkLmNvbSIsImFjdGlvbiI6InRva2VuLWFwaSIsImFwaVZlcnNpb24iOiJ2MiIsImlhdCI6MTc0NTQzNzA3N30.6LVCAxxFKTNzxEpwQGOtF3Vpzm-r-j-PKsdF7Spf7s4";
const goalUSD = 20000;

const PURPE_MINT = "HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL";
const PYUSD_MINT = "5KdM72GCe2TqcczLs1BdKx4445tXrRBv9oa8s8T6pump";
const SOL_MINT = "So11111111111111111111111111111111111111112";

// Log everything like a paranoid squirrel
async function fetchTokenList() {
  try {
    console.log("Fetching token list...");
    const res = await fetch(`https://public-api.solscan.io/v2/account/tokens?account=${walletAddress}`);
    const data = await res.json();
    console.log("Token list response:", data);
    return data.data || [];
  } catch (err) {
    console.error("Error fetching token list:", err);
    return [];
  }
}

async function fetchTokenPrice(mint) {
  try {
    const res = await fetch(`https://pro-api.solscan.io/v2.0/token/price?address=${mint}`, {
      headers: {
        accept: "application/json",
        token: solscanApiKey
      }
    });
    const data = await res.json();
    console.log(`Price for ${mint}:`, data);
    return data?.data?.[0]?.price || 0;
  } catch (err) {
    console.error("Error fetching price for", mint, err);
    return 0;
  }
}

async function fetchSolBalance() {
  try {
    const res = await fetch(`https://public-api.solscan.io/v2/account?account=${walletAddress}`);
    const data = await res.json();
    console.log("SOL account response:", data);
    return (data?.data?.lamports || 0) / 1_000_000_000;
  } catch (err) {
    console.error("Error fetching SOL balance:", err);
    return 0;
  }
}

async function updateTracker() {
  console.log("=== Starting updateTracker() ===");

  try {
    const [tokenList, solBalance, solPrice] = await Promise.all([
      fetchTokenList(),
      fetchSolBalance(),
      fetchTokenPrice(SOL_MINT)
    ]);

    let totalUSD = solBalance * solPrice;
    let breakdown = `SOL: $${(totalUSD).toFixed(2)}<br>`;

    for (const token of tokenList) {
      if (!token.tokenAmount || !token.tokenAddress) {
        console.warn("Skipping invalid token:", token);
        continue;
      }

      const mint = token.tokenAddress;
      const amount = parseFloat(token.tokenAmount.amount);
      const decimals = token.tokenAmount.decimals;

      if (mint === PURPE_MINT || mint === PYUSD_MINT) {
        const realAmount = amount / Math.pow(10, decimals);
        const price = await fetchTokenPrice(mint);
        const usdValue = realAmount * price;
        totalUSD += usdValue;

        const name = mint === PURPE_MINT ? "PURPE" : "PYUSD";
        breakdown += `${name}: $${usdValue.toFixed(2)}<br>`;
      }
    }

    // Update UI
    const percent = Math.min((totalUSD / goalUSD) * 100, 100);
    document.getElementById("current-amount").textContent = `$${totalUSD.toFixed(2)}`;
    document.getElementById("progress-fill").style.width = `${percent}%`;
    document.getElementById("breakdown").innerHTML = breakdown;

    const now = new Date();
    document.getElementById("last-updated").textContent = "Last updated: " + now.toLocaleTimeString();

    console.log("=== updateTracker DONE ===");

  } catch (err) {
    console.error("updateTracker failed:", err);
    document.getElementById("last-updated").textContent = "Error: " + err.message;
  }
}

// Fire it up
updateTracker();
setInterval(updateTracker, 15000);
