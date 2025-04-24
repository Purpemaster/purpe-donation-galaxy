const walletAddress = "9uo3TB4a8synap9VMNpby6nzmnMs9xJWmgo2YKJHZWVn";
const goalUSD = 20000;

const PURPE_MINT = "HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL";
const PYUSD_MINT = "5KdM72GCe2TqcczLs1BdKx4445tXrRBv9oa8s8T6pump";
const SOL_MINT = "So11111111111111111111111111111111111111112";

const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), "confirmed");

async function fetchTokenAccounts() {
  try {
    const response = await connection.getParsedTokenAccountsByOwner(
      new solanaWeb3.PublicKey(walletAddress),
      { programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
    );
    return response.value;
  } catch (err) {
    console.error("Failed to fetch token accounts:", err);
    return [];
  }
}

async function fetchSOLBalance() {
  try {
    const balance = await connection.getBalance(new solanaWeb3.PublicKey(walletAddress));
    return balance / solanaWeb3.LAMPORTS_PER_SOL;
  } catch (err) {
    console.error("Failed to fetch SOL balance:", err);
    return 0;
  }
}

async function fetchTokenPrice(mintAddress) {
  try {
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
    const data = await response.json();
    return data?.data?.[mintAddress]?.price || 0;
  } catch (err) {
    console.error("Price fetch failed for", mintAddress, err);
    return 0;
  }
}

async function updateTracker() {
  try {
    const [tokenAccounts, solBalance, solPrice] = await Promise.all([
      fetchTokenAccounts(),
      fetchSOLBalance(),
      fetchTokenPrice(SOL_MINT)
    ]);

    let totalUSD = solBalance * solPrice;
    let breakdown = `SOL: $${(totalUSD).toFixed(2)}<br>`;

    for (const account of tokenAccounts) {
      const info = account.account.data.parsed.info;
      const mint = info.mint;
      const amount = parseFloat(info.tokenAmount.amount);
      const decimals = info.tokenAmount.decimals;
      const realAmount = amount / Math.pow(10, decimals);

      if ([PURPE_MINT, PYUSD_MINT].includes(mint)) {
        const price = await fetchTokenPrice(mint);
        const usdValue = realAmount * price;
        totalUSD += usdValue;
        const name = mint === PURPE_MINT ? "PURPE" : "PYUSD";
        breakdown += `${name}: $${usdValue.toFixed(2)}<br>`;
      }
    }

    const percent = Math.min((totalUSD / goalUSD) * 100, 100);
    document.getElementById("current-amount").textContent = `$${totalUSD.toFixed(2)}`;
    document.getElementById("progress-fill").style.width = `${percent}%`;
    document.getElementById("breakdown").innerHTML = breakdown;

    const now = new Date();
    document.getElementById("last-updated").textContent = "Letztes Update: " + now.toLocaleTimeString();

  } catch (err) {
    document.getElementById("last-updated").textContent = "Fehler beim Update: " + err.message;
    console.error("updateTracker error:", err);
  }
}

updateTracker();
setInterval(updateTracker, 15000);
