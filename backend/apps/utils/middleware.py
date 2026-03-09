from django.conf import settings


class SecurityHeadersMiddleware:
    """Attach additional security headers to every response."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if settings.CONTENT_SECURITY_POLICY:
            response.setdefault("Content-Security-Policy", settings.CONTENT_SECURITY_POLICY)

        if settings.PERMISSIONS_POLICY:
            response.setdefault("Permissions-Policy", settings.PERMISSIONS_POLICY)

        if settings.CROSS_ORIGIN_EMBEDDER_POLICY:
            response.setdefault(
                "Cross-Origin-Embedder-Policy",
                settings.CROSS_ORIGIN_EMBEDDER_POLICY,
            )

        if settings.CROSS_ORIGIN_RESOURCE_POLICY:
            response.setdefault(
                "Cross-Origin-Resource-Policy",
                settings.CROSS_ORIGIN_RESOURCE_POLICY,
            )

        return response