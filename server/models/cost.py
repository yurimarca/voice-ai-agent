from dataclasses import dataclass
from typing import Dict, Any


@dataclass
class CostCalculator:
    INPUT_COST_PER_1K: float = 0.032    # $32 per million = $0.032 per 1K
    OUTPUT_COST_PER_1K: float = 0.064   # $64 per million = $0.064 per 1K  
    CACHED_COST_PER_1K: float = 0.0004  # $0.40 per million = $0.0004 per 1K
    
    @staticmethod
    def calculate_cost(input_tokens: int, output_tokens: int, cached_tokens: int) -> float:
        """Calculate cost based on token usage"""
        return (
            (input_tokens / 1000 * CostCalculator.INPUT_COST_PER_1K) +
            (output_tokens / 1000 * CostCalculator.OUTPUT_COST_PER_1K) +
            (cached_tokens / 1000 * CostCalculator.CACHED_COST_PER_1K)
        )


@dataclass 
class SessionCostTracker:
    session_cost: float = 0.0
    total_input_tokens: int = 0
    total_output_tokens: int = 0
    total_cached_tokens: int = 0
    
    def reset(self):
        """Reset cost tracking for new session"""
        self.session_cost = 0.0
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cached_tokens = 0
    
    def update_from_usage(self, usage: Dict[str, Any]) -> float:
        """Update costs from OpenAI usage data and return incremental cost"""
        input_tokens = usage.get("input_tokens", 0)
        output_tokens = usage.get("output_tokens", 0)
        cached_tokens = usage.get("input_token_details", {}).get("cached_tokens", 0)
        
        # Track incremental tokens to avoid double counting
        new_input_tokens = input_tokens - self.total_input_tokens
        new_output_tokens = output_tokens - self.total_output_tokens
        new_cached_tokens = cached_tokens - self.total_cached_tokens
        
        # Update totals
        self.total_input_tokens = input_tokens
        self.total_output_tokens = output_tokens  
        self.total_cached_tokens = cached_tokens
        
        # Calculate incremental cost
        incremental_cost = CostCalculator.calculate_cost(
            new_input_tokens, new_output_tokens, new_cached_tokens
        )
        self.session_cost += incremental_cost
        
        return incremental_cost
    
    def get_cost_data(self) -> Dict[str, Any]:
        """Get current cost data for client update"""
        return {
            "total": self.session_cost,
            "inputTokens": self.total_input_tokens,
            "outputTokens": self.total_output_tokens,
            "cachedTokens": self.total_cached_tokens
        }