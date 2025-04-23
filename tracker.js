const walletAddress = "9uo3TB4a8synap9VMNpby6nzmnMs9xJWmgo2YKJHZWVn";
const connection = new solanaWeb3.Connection("https://rpc.helius.xyz/?api-key=2e046356-0f0c-4880-93cc-6d5467e81c73");
const goalUSD = 20000;

const PURPE_MINT = "HBoNJ5v8g71s2boRivrHnfSB5MVPLDHHyVjruPfhGkvL";
const PYUSD_MINT = "5KdM72GCe2TqcczLs1BdKx4445tXrRBv9oa8s8T6pump";

const trackedMints = {
  [PURPE_MINT]: { name: "PURPE", decimals: 1 },
  [PYUSD_MINT]: { name: "PYUSD", decimals: 6 }
};

async function fetchSolPrice() {
  const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
  const data = await res.json();
  return data.solana?.usd || 0;
}

async function fetchPurpePrice() {
  const res = await fetch(`https://public-api.birdeye.so/public/price?address=${PURPE_MINT}`, {
    headers: { "X-API-KEY": "f80a250b67bc411dadbadadd6ecd2cf2" }
  });
  const data = await res.json();
  return parseFloat(data?.data?.value || "0");
}

async function fetchBalance() {
  try {
    const owner = new solanaWeb3.PublicKey(walletAddress);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, {
      programId: new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    });

    const solBalance = await connection.getBalance(owner);
    const solAmount = solBalance / solanaWeb3.LAMPORTS_PER_SOL;
    const solPrice = await fetchSolPrice();
    const solUSD = solAmount * solPrice;

    let purpePrice = await fetchPurpePrice();

    let totalUSD = solUSD;
    let breakdown = `SOL: $${solUSD.toFixed(2)}<br>`;

    for (const acc of tokenAccounts.value) {
      const info = acc.account.data.parsed.info;
      const mint = info.mint;
      const amountRaw = parseFloat(info.tokenAmount.amount);
      const decimals = parseInt(info.tokenAmount.decimals);

      if (trackedMints[mint]) {
        const realAmount = amountRaw / Math.pow(10, decimals);
        let price = 1.0;

        if (mint === PURPE_MINT) price = purpePrice;
        if (mint === PYUSD_MINT) price = 1.0; // fix auf echten Stablepreis

        const usd = realAmount * price;
        totalUSD += usd;
        breakdown += `${trackedMints[mint].name}: $${usd.toFixed(2)}<br>`;
      }
    }

    const percent = Math.min((totalUSD / goalUSD) * 100, 100);
    document.getElementById("current-amount").textContent = `$${totalUSD.toFixed(2)}`;
    document.getElementById("progress-fill").style.width = `${percent}%`;
    document.getElementById("breakdown").innerHTML = breakdown;

    const now = new Date();
    document.getElementById("last-updated").textContent = "Letztes Update: " + now.toLocaleTimeString();
  } catch (err) {
    document.getElementById("last-updated").textContent = "Fehler: " + err.message;
    console.error("Tracker failt:", err);
  }
}

fetchBalance();
setInterval(fetchBalance, 10000);
