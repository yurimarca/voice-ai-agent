import './CostDisplay.css';

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
    <div className="cost-display">
      <div className="cost-header">
        💰 <span className="cost-title">Conversation Cost</span>
      </div>

      <div className="cost-main">
        <span className="cost-total">{formatCost(cost.total)}</span>
      </div>

      <div className="token-breakdown">
        <h4 className="breakdown-title">Token Usage</h4>
        <div className="token-grid">
          <div className="token-item input">
            <div className="token-icon">📥</div>
            <div className="token-info">
              <span className="token-type">Input</span>
              <span className="token-count">{cost.inputTokens.toLocaleString()}</span>
              <span className="token-cost">{formatCost((cost.inputTokens / 1000) * 0.032)}</span>
            </div>
          </div>

          <div className="token-item output">
            <div className="token-icon">📤</div>
            <div className="token-info">
              <span className="token-type">Output</span>
              <span className="token-count">{cost.outputTokens.toLocaleString()}</span>
              <span className="token-cost">{formatCost((cost.outputTokens / 1000) * 0.064)}</span>
            </div>
          </div>

          {cost.cachedTokens > 0 && (
            <div className="token-item cached">
              <div className="token-icon">⚡</div>
              <div className="token-info">
                <span className="token-type">Cached</span>
                <span className="token-count">{cost.cachedTokens.toLocaleString()}</span>
                <span className="token-cost">{formatCost((cost.cachedTokens / 1000) * 0.0004)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CostDisplay;