package com.example.jwtDemo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.jwtDemo.dto.ProfileResponse;
import com.example.jwtDemo.dto.ProfileUpdateRequest;
import com.example.jwtDemo.entity.User;
import com.example.jwtDemo.repository.UserRepository;

@RestController
@RequestMapping("/customer/profile")
public class ProfileController {

    private final UserRepository userRepository;

    public ProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getUserProfile(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(new ProfileResponse(
                user.getName(),
                user.getUsername(),
                user.getRole(),
                user.getPhone(),
                user.getAddress(),
                user.getEmail()
        ));
    }

    @PutMapping
    public ResponseEntity<?> updateUserProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                @RequestBody ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(request.name());
        user.setPhone(request.phone());
        user.setAddress(request.address());
        user.setEmail(request.email());

        userRepository.save(user);

        return ResponseEntity.ok(new ProfileResponse(
                user.getName(),
                user.getUsername(),
                user.getRole(),
                user.getPhone(),
                user.getAddress(),
                user.getEmail()
        ));
    }
}