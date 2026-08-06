package com.example.jwtDemo.dto;

public record ProfileResponse(
	String name,
    String username,
    String role,
    String phone,
    String address,
    String email
) {}
