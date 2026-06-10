export function serializeGuest(guest: Record<string, unknown>) {
  return {
    ...guest,
    createdAt:
      guest.createdAt instanceof Date
        ? guest.createdAt.toISOString()
        : guest.createdAt,
    updatedAt:
      guest.updatedAt instanceof Date
        ? guest.updatedAt.toISOString()
        : guest.updatedAt,
  };
}

export function serializeConfig(config: Record<string, unknown>) {
  return {
    ...config,
    updatedAt:
      config.updatedAt instanceof Date
        ? config.updatedAt.toISOString()
        : config.updatedAt,
  };
}
