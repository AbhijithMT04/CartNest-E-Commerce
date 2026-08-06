package com.example.jwtDemo.dto;

public record ProfileUpdateRequest(
		String name,
        String phone,
        String address,
        String email
) {
}