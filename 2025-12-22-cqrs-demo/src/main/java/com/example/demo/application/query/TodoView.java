package com.example.demo.application.query;

import java.util.UUID;

public record TodoView(
    UUID id,
    String title,
    String description,
    boolean completed
) {}
