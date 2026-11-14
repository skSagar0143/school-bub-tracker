package com.bus.modules.user.dto;

import java.util.List;

import jakarta.validation.constraints.Size;

public record GenerateLoginAccountsRequest(
        @Size(max = 500) List<Long> studentIds,
        @Size(max = 500) List<Long> driverIds
) {}
