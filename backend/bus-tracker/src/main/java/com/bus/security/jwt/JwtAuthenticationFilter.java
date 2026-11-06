package com.bus.security.jwt;

import java.io.IOException;
import java.util.Collection;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authorization = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(authorization)
                && authorization.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = authorization.substring(7).trim();

            if (StringUtils.hasText(token)) {
                try {
                    Claims claims = jwtService.parseAndValidate(token);
                    String subject = claims.getSubject();

                    if (StringUtils.hasText(subject)) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        subject, null, toAuthorities(claims.get("authorities")));

                        authentication.setDetails(
                                new org.springframework.security.web.authentication.WebAuthenticationDetailsSource()
                                        .buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (JwtException | IllegalArgumentException exception) {
                    // Invalid/expired tokens remain unauthenticated; protected routes return 401.
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private Collection<SimpleGrantedAuthority> toAuthorities(Object claim) {
        if (!(claim instanceof List<?> values)) {
            return List.of();
        }

        return values.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .filter(StringUtils::hasText)
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}
