
function CostDisplay({ cost }) {
  const formatCost = (amount) => {
    if (amount < 0.001) {
      return `$${(amount * 1000).toFixed(3)}‰`; // Display in thousandths for very small amounts
    }
    return `$${amount.toFixed(4)}`;
  };

  if (cost.total === 0) {
    return null; // Don't show component if no cost yet
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-4 mb-5 font-mono transition-all duration-300 shadow-custom hover:-translate-y-px hover:shadow-custom-lg">
      <div className="flex items-center gap-2 mb-3">
        💰 <span className="font-semibold text-text-primary text-sm">Conversation Cost</span>
      </div>

      <div className="text-center mb-4">
        <span className="text-3xl md:text-2xl font-bold text-success">{formatCost(cost.total)}</span>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="m-0 mb-3 text-sm text-text-primary font-semibold">Token Usage</h4>
        <div className="flex gap-3 justify-between md:flex-col md:gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg flex-1 min-w-0 bg-primary/10 border border-primary">
            <div className="text-lg flex-shrink-0">📥</div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">Input</span>
              <span className="text-sm text-text-primary font-semibold">{cost.inputTokens.toLocaleString()}</span>
              <span className="text-xs text-text-secondary font-mono">{formatCost((cost.inputTokens / 1000) * 0.032)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg flex-1 min-w-0 bg-success/10 border border-success">
            <div className="text-lg flex-shrink-0">📤</div>
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">Output</span>
              <span className="text-sm text-text-primary font-semibold">{cost.outputTokens.toLocaleString()}</span>
              <span className="text-xs text-text-secondary font-mono">{formatCost((cost.outputTokens / 1000) * 0.064)}</span>
            </div>
          </div>

          {cost.cachedTokens > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg flex-1 min-w-0 bg-secondary/10 border border-secondary">
              <div className="text-lg flex-shrink-0">⚡</div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">Cached</span>
                <span className="text-sm text-text-primary font-semibold">{cost.cachedTokens.toLocaleString()}</span>
                <span className="text-xs text-text-secondary font-mono">{formatCost((cost.cachedTokens / 1000) * 0.0004)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CostDisplay;