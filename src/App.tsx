import React, { useState, useMemo } from "react";

const formatCurr = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);

const calcPMT = (rate, years, amount) => {
  if (!amount || !years) return 0;
  const r = rate / 100 / 12,
    n = years * 12;
  return r === 0 ? amount / n : (amount * r) / (1 - Math.pow(1 + r, -n));
};

export default function HomePurchaseStrategy() {
  const [loanType, setLoanType] = useState("Conventional");
  const [price, setPrice] = useState(500000);
  const [baseRate, setBaseRate] = useState(6.5);
  const [term, setTerm] = useState(30);
  const [taxes, setTaxes] = useState(5000);
  const [insurance, setInsurance] = useState(1500);
  const [pmiFactor, setPmiFactor] = useState(0.55);

  const [tierData, setTierData] = useState([
    { id: 3, pct: 3, show: false, pRate: 6.0, pCost: 1.0 },
    { id: 3.5, pct: 3.5, show: false, pRate: 6.0, pCost: 1.0 },
    { id: 5, pct: 5, show: true, pRate: 6.0, pCost: 1.0 },
    { id: 10, pct: 10, show: true, pRate: 6.0, pCost: 1.0 },
    { id: 15, pct: 15, show: false, pRate: 6.0, pCost: 1.0 },
    { id: 20, pct: 20, show: true, pRate: 6.0, pCost: 1.0 },
    { id: 30, pct: 30, show: false, pRate: 6.0, pCost: 1.0 },
    { id: 40, pct: 40, show: false, pRate: 6.0, pCost: 1.0 },
    {
      id: "custom",
      downAmt: 50000,
      show: false,
      pRate: 6.0,
      pCost: 1.0,
      isCustom: true,
    },
  ]);

  const updateTier = (id, key, val) => {
    setTierData((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [key]: val } : t))
    );
  };

  const escrow = (Number(taxes) + Number(insurance)) / 12;

  const results = useMemo(() => {
    const isFHA = loanType === "FHA";
    const p = Number(price) || 0;

    return tierData.map((t) => {
      let down = 0;
      let activePct = 0;

      if (t.isCustom) {
        down = Number(t.downAmt) || 0;
        activePct = p > 0 ? (down / p) * 100 : 0;
      } else {
        activePct = Number(t.pct) || 0;
        down = p * (activePct / 100);
      }

      const baseLoan = p - down;
      const ufmip = isFHA ? baseLoan * 0.0175 : 0;
      const finalLoanAmt = baseLoan + ufmip;

      const pmtB = calcPMT(baseRate, term, finalLoanAmt);

      const requiresPMI = isFHA || activePct < 20;
      const pmi = requiresPMI ? (finalLoanAmt * (pmiFactor / 100)) / 12 : 0;

      const basePITI = pmtB + pmi + escrow;

      const cost = finalLoanAmt * (t.pCost / 100);
      const pLoan = finalLoanAmt;
      const pmtP = calcPMT(t.pRate, term, pLoan);
      const pPITI = pmtP + pmi + escrow;

      const sav = basePITI - pPITI;
      const be = sav > 0 ? cost / sav : 0;

      return {
        ...t,
        down,
        baseLoan,
        ufmip,
        finalLoanAmt,
        pmi,
        basePITI,
        pPITI,
        sav,
        be,
        isFHA,
        cost,
        activePct,
      };
    });
  }, [
    price,
    baseRate,
    term,
    taxes,
    insurance,
    pmiFactor,
    tierData,
    escrow,
    loanType,
  ]);

  const inp = {
    width: "100%",
    padding: "8px",
    marginTop: "4px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  };
  return (
    <div
      style={{
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        background: "#f1f5f9",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @media print { .no-print { display: none !important; } .app { zoom: 0.7; } }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
      `}</style>

      <div
        className="no-print"
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px #0002",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ margin: 0 }}>Home Purchase Strategy</h2>
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 20px",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Print Report
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            marginBottom: "20px",
            borderBottom: "1px solid #eee",
            paddingBottom: "15px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            <input
              type="radio"
              name="loanType"
              value="Conventional"
              checked={loanType === "Conventional"}
              onChange={(e) => setLoanType(e.target.value)}
              style={{ transform: "scale(1.2)" }}
            />{" "}
            Conventional
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              marginLeft: "15px",
            }}
          >
            <input
              type="radio"
              name="loanType"
              value="FHA"
              checked={loanType === "FHA"}
              onChange={(e) => setLoanType(e.target.value)}
              style={{ transform: "scale(1.2)" }}
            />{" "}
            FHA
          </label>
        </div>

        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <label
            style={{
              flex: 1,
              minWidth: "120px",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            Price{" "}
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={inp}
            />
          </label>
          <label
            style={{
              flex: 1,
              minWidth: "120px",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            Base Rate %{" "}
            <input
              type="number"
              step="0.125"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
              style={inp}
            />
          </label>
          <label
            style={{
              flex: 1,
              minWidth: "120px",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            Taxes/Yr{" "}
            <input
              type="number"
              value={taxes}
              onChange={(e) => setTaxes(e.target.value)}
              style={inp}
            />
          </label>
          <label
            style={{
              flex: 1,
              minWidth: "120px",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            Ins/Yr{" "}
            <input
              type="number"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              style={inp}
            />
          </label>
          <label
            style={{
              flex: 1,
              minWidth: "120px",
              fontWeight: "bold",
              fontSize: "12px",
            }}
          >
            PMI / MIP %{" "}
            <input
              type="number"
              step="0.01"
              value={pmiFactor}
              onChange={(e) => setPmiFactor(e.target.value)}
              style={inp}
            />
          </label>
        </div>

        <div
          style={{
            marginTop: "15px",
            paddingTop: "15px",
            borderTop: "1px solid #eee",
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{ fontSize: "13px", fontWeight: "bold", color: "#64748b" }}
          >
            Show Tiers:
          </span>
          {tierData.map((t) => {
            if (t.isCustom) {
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "bold",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={t.show}
                      onChange={(e) =>
                        updateTier(t.id, "show", e.target.checked)
                      }
                    />
                    Custom:
                  </label>
                  ${" "}
                  <input
                    type="number"
                    step="1000"
                    value={t.downAmt}
                    onChange={(e) =>
                      updateTier(t.id, "downAmt", e.target.value)
                    }
                    style={{
                      width: "90px",
                      padding: "4px 6px",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      fontSize: "12px",
                    }}
                  />
                </div>
              );
            }
            return (
              <label
                key={t.id}
                style={{
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <input
                  type="checkbox"
                  checked={t.show}
                  onChange={(e) => updateTier(t.id, "show", e.target.checked)}
                />{" "}
                {t.pct}%
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid">
        {results
          .filter((t) => t.show)
          .map((r) => (
            <div
              key={r.id}
              style={{
                background: "#fff",
                borderRadius: "12px",
                borderTop: `6px solid ${
                  r.activePct >= 20 && !r.isFHA ? "#059669" : "#d97706"
                }`,
                boxShadow: "0 4px 6px #0001",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background:
                    r.activePct >= 20 && !r.isFHA ? "#059669" : "#d97706",
                  padding: "12px 20px",
                  color: "#fff",
                  fontWeight: "bold",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "18px" }}>
                  {r.isCustom
                    ? "Custom Down Option"
                    : `${r.activePct}% Down Option`}
                  {r.isCustom && (
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: "normal",
                        marginLeft: "8px",
                        opacity: 0.9,
                      }}
                    >
                      ({r.activePct.toFixed(1)}%)
                    </span>
                  )}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    background: "rgba(255,255,255,0.2)",
                    padding: "4px 8px",
                    borderRadius: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  {r.isFHA || r.activePct < 20 ? "PMI/MIP Included" : "No PMI"}
                </span>
              </div>

              <div style={{ padding: "20px" }}>
                <div
                  style={{
                    borderBottom: "1px solid #eee",
                    paddingBottom: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Down Payment:</span>{" "}
                    <b style={{ fontSize: "16px" }}>{formatCurr(r.down)}</b>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Base Loan:</span>{" "}
                    <b style={{ fontSize: "16px" }}>{formatCurr(r.baseLoan)}</b>
                  </div>
                  {r.isFHA && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        color: "#b91c1c",
                      }}
                    >
                      <span>FHA Funding Fee (1.75%):</span>{" "}
                      <b>+ {formatCurr(r.ufmip)}</b>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "6px",
                      paddingTop: "6px",
                      borderTop: "1px solid #eee",
                      fontSize: "15px",
                    }}
                  >
                    <span style={{ color: "#0f172a", fontWeight: "bold" }}>
                      Total Loan Amt:
                    </span>{" "}
                    <b style={{ color: "#0f172a" }}>
                      {formatCurr(r.finalLoanAmt)}
                    </b>
                  </div>
                </div>

                <div
                  style={{
                    background: "#f8fafc",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center",
                    marginBottom: "15px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748b",
                      fontWeight: "bold",
                    }}
                  >
                    BASE MONTHLY PITI
                  </div>
                  <div
                    style={{
                      fontSize: "32px",
                      fontWeight: "900",
                      color: "#0f172a",
                    }}
                  >
                    {formatCurr(r.basePITI)}
                  </div>

                  {r.pmi > 0 && (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#d97706",
                        marginTop: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      Includes {formatCurr(r.pmi)}/mo in{" "}
                      {r.isFHA ? "MIP" : "PMI"}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: "#f0f9ff",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #bae6fd",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#0369a1",
                      marginBottom: "10px",
                    }}
                  >
                    Buy-Down Strategy
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginBottom: "15px",
                    }}
                  >
                    <label
                      style={{ flex: 1, fontSize: "11px", fontWeight: "bold" }}
                    >
                      Rate %{" "}
                      <input
                        type="number"
                        step="0.125"
                        value={r.pRate}
                        onChange={(e) =>
                          updateTier(r.id, "pRate", e.target.value)
                        }
                        style={inp}
                      />
                    </label>
                    <label
                      style={{ flex: 1, fontSize: "11px", fontWeight: "bold" }}
                    >
                      Points %{" "}
                      <input
                        type="number"
                        step="0.125"
                        value={r.pCost}
                        onChange={(e) =>
                          updateTier(r.id, "pCost", e.target.value)
                        }
                        style={inp}
                      />
                    </label>
                  </div>

                  <div
                    style={{
                      background: "#fff",
                      padding: "12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                        color: "#b91c1c",
                        fontWeight: "bold",
                      }}
                    >
                      <span style={{ color: "#64748b" }}>
                        Cash Due at Close:
                      </span>
                      <b>{formatCurr(r.cost)}</b>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ color: "#64748b" }}>New Payment:</span>
                      <b style={{ color: "#0f172a" }}>{formatCurr(r.pPITI)}</b>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "#059669",
                        marginBottom: "6px",
                      }}
                    >
                      <span>Monthly Savings:</span>
                      <b>{formatCurr(r.sav)}</b>
                    </div>
                    <div
                      style={{
                        borderTop: "1px solid #eee",
                        marginTop: "8px",
                        paddingTop: "8px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "bold",
                          color: "#64748b",
                          fontSize: "12px",
                        }}
                      >
                        BREAK-EVEN:
                      </span>
                      <b style={{ color: "#2563eb", fontSize: "16px" }}>
                        {r.be > 0 ? `${Math.ceil(r.be)} Mos` : "N/A"}
                      </b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
