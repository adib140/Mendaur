<?php

namespace App\Http\Controllers;

use App\Models\Notifikasi;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications
    public function index(Request $request)
    {
        try {
            $user = $request->user();

            // Get notifications with pagination
            $perPage = $request->query('per_page', 20);
            $notifications = Notifikasi::where('user_id', $user->user_id)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $notifications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/notifications/unread-count
    public function unreadCount(Request $request)
    {
        try {
            $user = $request->user();
            $count = Notifikasi::where('user_id', $user->user_id)
                ->where('is_read', false)
                ->count();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'unread_count' => $count
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch unread count',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/notifications/unread
    public function unread(Request $request)
    {
        try {
            $user = $request->user();

            $notifications = Notifikasi::where('user_id', $user->user_id)
                ->where('is_read', false)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $notifications,
                'count' => count($notifications)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch unread notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/notifications/{id}
    public function show(Request $request, $notificationId)
    {
        try {
            $user = $request->user();

            $notification = Notifikasi::where('notifikasi_id', $notificationId)
                ->where('user_id', $user->user_id)
                ->firstOrFail();

            return response()->json([
                'status' => 'success',
                'data' => $notification
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to fetch notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/notifications/{id}/read
    public function markAsRead(Request $request, $notificationId)
    {
        try {
            $user = $request->user();

            $notification = Notifikasi::where('notifikasi_id', $notificationId)
                ->where('user_id', $user->user_id)
                ->firstOrFail();

            $notification->markAsRead();

            return response()->json([
                'status' => 'success',
                'message' => 'Notification marked as read',
                'data' => $notification
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark notification as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // PATCH /api/notifications/mark-all-read
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user();

            Notifikasi::where('user_id', $user->user_id)
                ->where('is_read', false)
                ->update(['is_read' => true]);

            return response()->json([
                'status' => 'success',
                'message' => 'All notifications marked as read'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to mark all notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // DELETE /api/notifications/{id}
    public function destroy(Request $request, $notificationId)
    {
        try {
            $user = $request->user();

            $notification = Notifikasi::where('notifikasi_id', $notificationId)
                ->where('user_id', $user->user_id)
                ->firstOrFail();

            $notification->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Notification deleted'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Notification not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // POST /api/notifications (Admin only)
    public function store(Request $request)
    {
        // Only admins/superadmins can create notifications
        if (!$request->user()->isAdminUser()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Only admins can create notifications'
            ], 403);
        }

        try {
            $validated = $request->validate([
                'user_id' => 'required|exists:users,user_id',
                'judul' => 'required|string|max:255',
                'pesan' => 'required|string',
                'tipe' => 'nullable|string',
                'related_id' => 'nullable|integer',
                'related_type' => 'nullable|string'
            ]);

            $notification = Notifikasi::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Notification created successfully',
                'data' => [
                    'notifikasi_id' => $notification->notifikasi_id,
                    'user_id' => $notification->user_id,
                    'judul' => $notification->judul,
                    'pesan' => $notification->pesan,
                    'tipe' => $notification->tipe,
                    'is_read' => $notification->is_read,
                    'related_id' => $notification->related_id,
                    'related_type' => $notification->related_type,
                    'created_at' => $notification->created_at,
                ]
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
