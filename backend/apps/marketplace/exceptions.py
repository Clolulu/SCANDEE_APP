from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)
    if response is not None:
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                return Response({'success': False, 'message': str(response.data.get('detail'))}, status=response.status_code)
            if not response.data.get('success'):
                response.data['success'] = False
            return response
        return response

    # Fallback for unhandled exceptions to always return JSON
    return Response(
        {'success': False, 'message': 'Internal server error'},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
