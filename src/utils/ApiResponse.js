class ApiResponse {
  constructor(
    statusCode, 
    data,
    message = "success"
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = true;

     // Informational responses(100 - 199)
        // Successful responses(200 - 299)
        // Redirection messages(300 - 399)
        // Client error responses(400 - 499)
        // Server error responses(500 - 599)
  }
}