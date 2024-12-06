import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

class DynamoDBService {
    constructor() {
        // Configure DynamoDB client
        const client = new DynamoDBClient({
            region: process.env.AWS_REGION || 'us-east-1'
        });
        
        this.docClient = DynamoDBDocumentClient.from(client);
        this.tableName = process.env.DYNAMODB_TABLE || 'Whiteboards';
    }

    async getWhiteboardData(whiteboardId) {
        try {
            const command = new GetCommand({
                TableName: this.tableName,
                Key: {
                    whiteboardId: whiteboardId
                }
            });
            
            const response = await this.docClient.send(command);
            return response.Item?.data || [];
        } catch (error) {
            console.error("Error fetching whiteboard data:", error);
            return [];
        }
    }

    async saveWhiteboardData(whiteboardId, data) {
        try {
            const command = new PutCommand({
                TableName: this.tableName,
                Item: {
                    whiteboardId: whiteboardId,
                    data: data,
                    lastModified: new Date().toISOString()
                }
            });
            
            await this.docClient.send(command);
        } catch (error) {
            console.error("Error saving whiteboard data:", error);
            throw error;
        }
    }

    async deleteWhiteboardData(whiteboardId) {
        try {
            const command = new DeleteCommand({
                TableName: this.tableName,
                Key: {
                    whiteboardId: whiteboardId
                }
            });
            
            await this.docClient.send(command);
        } catch (error) {
            console.error("Error deleting whiteboard data:", error);
            throw error;
        }
    }
}

export default new DynamoDBService(); 