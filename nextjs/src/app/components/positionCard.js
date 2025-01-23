export default function PositionCard({ position }) {
  const { id, investUnits, strikePrice, expiry, isActive } = position;

  return (
    <div className="position-card">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"
              }`}
          />
          <span className="text-green-400 font-medium">
            {isActive ? "Redeemable" : "Expired"}
          </span>
        </div>
        <span className="text-sm text-gray-400">
          Maturity Date: {expiry}
        </span>
      </div>

      {/* Investment Info */}
      <div>
        <p className="text-gray-400 text-sm">Investment Amount</p>
        <p className="text-xl font-semibold">
          {investUnits} Units
        </p>
      </div>

      {/* Redeem Info */}
      <div className="text-sm text-gray-300">
        <p>
          Current Fair Price &gt; Strike Price, redeem now to
        </p>
        <p className="flex items-center gap-2 font-semibold text-lg">
          Receive
          <img src="/USDL.jpeg" alt="USDL" className="w-6 h-6" />
          {strikePrice} USDL
        </p>
      </div>

      {/* Actions */}


      <button
        className={`redeem-button ${isActive
            ? "active"
            : ""
          }`}
        disabled={!isActive}
      >
        Redeem
      </button>

    </div>
  );
}
