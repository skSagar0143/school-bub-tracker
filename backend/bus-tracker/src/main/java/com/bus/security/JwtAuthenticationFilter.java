package com.bus.security;

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

        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(authorizationHeader)
                && authorizationHeader.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String token = authorizationHeader.substring(7).trim();

            if (StringUtils.hasText(token)) {
                try {
                    Claims claims = jwtService.parseClaims(token);
                    String subject = claims.getSubject();

                    if (StringUtils.hasText(subject)) {
                        UsernamePasswordAuthenticationToken authentication =
                                new UsernamePasswordAuthenticationToken(
                                        subject,
                                        null,
                                        extractAuthorities(claims.get("roles")));

                        authentication.setDetails(
                                new org.springframework.security.web.authentication.WebAuthenticationDetailsSource()
                                        .buildDetails(request));

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } catch (JwtException | IllegalArgumentException | IllegalStateException exception) {
                    SecurityContextHolder.clearContext();
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private Collection<SimpleGrantedAuthority> extractAuthorities(Object rolesClaim) {
        if (!(rolesClaim instanceof List<?> roles)) {
            return List.of();
        }

        return roles.stream()
                .filter(String.class::isInstance)
                .map(String.class::cast)
                .filter(StringUtils::hasText)
                .map(SimpleGrantedAuthority::new)
                .toList();
    }
}
