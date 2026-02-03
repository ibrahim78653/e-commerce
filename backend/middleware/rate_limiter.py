"""
Rate limiting middleware to prevent abuse
Uses in-memory storage for development, can be upgraded to Redis for production
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, Tuple
import time


class RateLimiter:
    """
    Simple in-memory rate limiter
    For production, use Redis-based rate limiting
    """
    
    def __init__(self):
        # Store: {ip_address: {endpoint: [(timestamp1, timestamp2, ...)]}}
        self.requests: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
    
    def is_rate_limited(self, identifier: str, endpoint: str, max_requests: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Check if request should be rate limited
        Returns (is_limited, retry_after_seconds)
        """
        current_time = time.time()
        cutoff_time = current_time - window_seconds
        
        # Clean old requests
        self.requests[identifier][endpoint] = [
            req_time for req_time in self.requests[identifier][endpoint]
            if req_time > cutoff_time
        ]
        
        # Check if limit exceeded
        request_count = len(self.requests[identifier][endpoint])
        
        if request_count >= max_requests:
            # Calculate retry_after from oldest request
            oldest_request = min(self.requests[identifier][endpoint])
            retry_after = int(window_seconds - (current_time - oldest_request))
            return True, retry_after
        
        # Add current request
        self.requests[identifier][endpoint].append(current_time)
        return False, 0
    
    def cleanup_old_entries(self):
        """
        Cleanup old entries to prevent memory bloat
        Should be called periodically in production
        """
        current_time = time.time()
        cutoff_time = current_time - 3600  # Keep last hour
        
        # Clean up
        identifiers_to_remove = []
        for identifier, endpoints in self.requests.items():
            endpoints_to_remove = []
            for endpoint, timestamps in endpoints.items():
                # Filter old timestamps
                endpoints[endpoint] = [ts for ts in timestamps if ts > cutoff_time]
                if not endpoints[endpoint]:
                    endpoints_to_remove.append(endpoint)
            
            # Remove empty endpoints
            for endpoint in endpoints_to_remove:
                del endpoints[endpoint]
            
            if not endpoints:
                identifiers_to_remove.append(identifier)
        
        # Remove empty identifiers
        for identifier in identifiers_to_remove:
            del self.requests[identifier]


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    # Check forwarded headers (for proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct client
    if request.client:
        return request.client.host
    
    return "unknown"


async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware to apply rate limiting to specific endpoints
    """
    # Define rate limits per endpoint pattern
    # Format: {endpoint_pattern: (max_requests, window_seconds)}
    rate_limits = {
        "/api/auth/login": (5, 60),  # 5 requests per minute
        "/api/auth/register": (3, 60),  # 3 requests per minute
        "/api/orders": (10, 60),  # 10 orders per minute
        "/api/products": (30, 60),  # 30 requests per minute
    }
    
    # Get client identifier (IP address)
    client_ip = get_client_ip(request)
    
    # Check if endpoint should be rate limited
    path = request.url.path
    endpoint_key = None
    max_requests = None
    window_seconds = None
    
    for pattern, (max_req, window) in rate_limits.items():
        if path.startswith(pattern):
            endpoint_key = pattern
            max_requests = max_req
            window_seconds = window
            break
    
    # Apply rate limiting if endpoint matches
    if endpoint_key and max_requests and window_seconds:
        is_limited, retry_after = rate_limiter.is_rate_limited(
            client_ip,
            endpoint_key,
            max_requests,
            window_seconds
        )
        
        if is_limited:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": retry_after
                },
                headers={"Retry-After": str(retry_after)}
            )
    
    # Continue processing request
    response = await call_next(request)
    return response
