export async function rateLimitPlaceholder(identifier: string, action: string) {
  void identifier;
  void action;
  return {
    allowed: true,
    remaining: 999
  };
}
