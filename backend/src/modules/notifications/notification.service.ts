import * as admin from 'firebase-admin';

export class NotificationService {
  /**
   * Tek bir kullanıcıya bildirim gönderir.
   */
  static async sendToUser(fcmToken: string, title: string, body: string, data?: any) {
    if (!fcmToken) return;

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              contentAvailable: true,
              sound: 'default',
            },
          },
        },
      };

      await admin.messaging().send(message);
      console.log(`Notification sent to user with token: ${fcmToken.substring(0, 10)}...`);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  /**
   * Birden fazla kullanıcıya bildirim gönderir.
   */
  static async sendToMultiple(tokens: string[], title: string, body: string, data?: any) {
    if (!tokens || tokens.length === 0) return;

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Successfully sent ${response.successCount} notifications; ${response.failureCount} failed.`);
    } catch (error) {
      console.error('Error sending multicast notification:', error);
    }
  }

  /**
   * Belirli bir konuya (topic) bildirim gönderir (Örn: 'new_questions').
   */
  static async sendToTopic(topic: string, title: string, body: string, data?: any) {
    try {
      const message: admin.messaging.TopicMessage = {
        topic,
        notification: {
          title,
          body,
        },
        data: data || {},
      };

      await admin.messaging().send(message);
      console.log(`Notification sent to topic: ${topic}`);
    } catch (error) {
      console.error(`Error sending topic notification (${topic}):`, error);
    }
  }
}
