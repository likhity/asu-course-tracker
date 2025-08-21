using System.Text;
using System.Text.Json;
using ASUCourseTracker.API.Models;

namespace ASUCourseTracker.API.Services
{
    public class ExpoNotificationService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<ExpoNotificationService> _logger;
        private const string ExpoApiUrl = "https://exp.host/--/api/v2/push/send";

        public ExpoNotificationService(HttpClient httpClient, ILogger<ExpoNotificationService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        /// <summary>
        /// Send a push notification using Expo Push API
        /// </summary>
        public async Task<bool> SendNotificationAsync(string expoPushToken, string title, string body, Dictionary<string, object>? data = null)
        {
            try
            {
                if (string.IsNullOrEmpty(expoPushToken) || !IsValidExpoPushToken(expoPushToken))
                {
                    _logger.LogWarning($"Invalid Expo push token: {expoPushToken}");
                    return false;
                }

                var notification = new
                {
                    to = expoPushToken,
                    title = title,
                    body = body,
                    data = data ?? new Dictionary<string, object>(),
                    priority = "high",
                    sound = "default",
                    channelId = "default"
                };

                var json = JsonSerializer.Serialize(notification);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(ExpoApiUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Successfully sent notification to token: {expoPushToken.Substring(0, 10)}...");
                    return true;
                }
                else
                {
                    _logger.LogError($"Failed to send notification. Status: {response.StatusCode}, Response: {responseContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending notification to token: {expoPushToken}");
                return false;
            }
        }

        /// <summary>
        /// Send a course seat change notification
        /// </summary>
        public async Task<bool> SendCourseNotificationAsync(User user, string courseCode, string oldSeats, string newSeats)
        {
            if (string.IsNullOrEmpty(user.ExpoPushToken))
            {
                _logger.LogWarning($"No Expo push token found for user {user.Email}");
                return false;
            }

            var title = $"🎓 {courseCode} - More Seats Available!";
            var body = $"Seats increased: {oldSeats} → {newSeats}";
            
            var data = new Dictionary<string, object>
            {
                {"type", "seat_change"},
                {"course_code", courseCode},
                {"old_seats", oldSeats},
                {"new_seats", newSeats},
                {"timestamp", DateTime.UtcNow.ToString("O")},
                {"user_id", user.Id}
            };

            return await SendNotificationAsync(user.ExpoPushToken, title, body, data);
        }

        /// <summary>
        /// Send a test notification
        /// </summary>
        public async Task<bool> SendTestNotificationAsync(string expoPushToken)
        {
            var title = "🧪 ASU Course Tracker Test";
            var body = "Push notifications are working correctly!";
            
            var data = new Dictionary<string, object>
            {
                {"type", "test"},
                {"timestamp", DateTime.UtcNow.ToString("O")}
            };

            return await SendNotificationAsync(expoPushToken, title, body, data);
        }

        /// <summary>
        /// Send multiple notifications in batch
        /// </summary>
        public async Task<bool> SendBatchNotificationsAsync(List<(string token, string title, string body, Dictionary<string, object>? data)> notifications)
        {
            try
            {
                var batchNotifications = notifications
                    .Where(n => IsValidExpoPushToken(n.token))
                    .Select(n => new
                    {
                        to = n.token,
                        title = n.title,
                        body = n.body,
                        data = n.data ?? new Dictionary<string, object>(),
                        priority = "high",
                        sound = "default",
                        channelId = "default"
                    })
                    .ToList();

                if (!batchNotifications.Any())
                {
                    _logger.LogWarning("No valid tokens found in batch notifications");
                    return false;
                }

                var json = JsonSerializer.Serialize(batchNotifications);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(ExpoApiUrl, content);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation($"Successfully sent {batchNotifications.Count} notifications");
                    return true;
                }
                else
                {
                    _logger.LogError($"Failed to send batch notifications. Status: {response.StatusCode}, Response: {responseContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending batch notifications");
                return false;
            }
        }

        /// <summary>
        /// Validate if the token is a valid Expo push token format
        /// </summary>
        private bool IsValidExpoPushToken(string token)
        {
            if (string.IsNullOrEmpty(token))
                return false;

            // Expo push tokens start with "ExponentPushToken[" or "ExpoPushToken[" 
            return token.StartsWith("ExponentPushToken[") || token.StartsWith("ExpoPushToken[");
        }

        /// <summary>
        /// Register/Update user's Expo push token
        /// </summary>
        public bool ValidateExpoPushToken(string token)
        {
            return IsValidExpoPushToken(token);
        }
    }
}

