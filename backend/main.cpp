#include "mbed.h"
#include <cstdio>
#include <cstring>

#define TL1_RED PC_10
#define TL1_YELLOW PC_11
#define TL1_GREEN PC_12

#define TL2_RED D5
#define TL2_YELLOW D6
#define TL2_GREEN D7

// Define serial connections
UnbufferedSerial pc(USBTX, USBRX, 115200);       // PC serial connection
UnbufferedSerial esp8266(PA_9, PA_10, 115200);   // ESP8266 serial connection

// WiFi credentials
const char* ssid = "MyNet";
const char* password = "samsungs20";

// Server details
const char* server_ip = "192.168.46.133";
const int server_port = 8080;
const char* request_path = "/services/ts/ez-go/gen/ez-go/api/Junction/JunctionService.ts";
const char* base64_auth = "YWRtaW46YWRtaW4="; // Base64-encoded "admin:admin"

// Traffic light struct with a constructor
struct traffic_light {
    DigitalOut red;
    DigitalOut yellow;
    DigitalOut green;

    // Constructor to initialize each color light
    traffic_light(PinName red_pin, PinName yellow_pin, PinName green_pin) 
        : red(red_pin), yellow(yellow_pin), green(green_pin) {}
};

// Traffic light control functions
void tl_green(DigitalOut& tl_red, DigitalOut& tl_yellow, DigitalOut& tl_green, int yellow_interval) {
    tl_yellow = 1;
    thread_sleep_for(yellow_interval);
    tl_red = 0;
    tl_yellow = 0;
    tl_green = 1;
}

void tl_red(DigitalOut& tl_red, DigitalOut& tl_yellow, DigitalOut& tl_green, int yellow_interval) {
    tl_green = 0;
    tl_yellow = 1;
    thread_sleep_for(yellow_interval);
    tl_yellow = 0;
    tl_red = 1;
}

// Helper function to send AT command and receive response
void sendCommand(const char* cmd, int timeout = 5000, bool wait_for_prompt = false) {
    esp8266.write(cmd, strlen(cmd));
    esp8266.write("\r\n", 2);
    pc.write("Sent: ", 6);
    pc.write(cmd, strlen(cmd));
    pc.write("\n", 1);

    Timer timer;
    timer.start();
    char c;
    bool prompt_received = !wait_for_prompt;
    while (timer.elapsed_time().count() < timeout * 1000) {
        if (esp8266.readable()) {
            esp8266.read(&c, 1);
            pc.write(&c, 1);
            if (wait_for_prompt && c == '>') {
                prompt_received = true;
                break;
            }
        }
    }
    timer.stop();
}

// Function to connect to WiFi
void connectToWiFi() {
    sendCommand("AT");
    sendCommand("AT+RST");
    ThisThread::sleep_for(2s);
    sendCommand("AT+CWMODE=1");

    char cmd[150];
    snprintf(cmd, sizeof(cmd), "AT+CWJAP=\"%s\",\"%s\"", ssid, password);
    sendCommand(cmd, 10000);
    sendCommand("AT+CIFSR");
    sendCommand("AT+CIPSTATUS");
}

// Function to process HTTP response and control traffic lights
void sendHttpRequest(traffic_light tls[2]) {
    char cmd[150];
    char rec[20];
    int rec_ctr = 0;

    snprintf(cmd, sizeof(cmd), "AT+CIPSTART=\"TCP\",\"%s\",%d", server_ip, server_port);
    sendCommand(cmd, 5000);  // Open connection to server

    // 2. Prepare HTTP GET request with explicit line endings and headers
    char http_request[300];
    snprintf(http_request, sizeof(http_request),
             "GET %s HTTP/1.1\r\n"
             "Host: %s\r\n"
             "Authorization: Basic %s\r\n"
             "Connection: close\r\n\r\n",
             request_path, server_ip, base64_auth);
    
    int request_len = strlen(http_request);

    // 3. Notify ESP8266 about the length of the data to send
    snprintf(cmd, sizeof(cmd), "AT+CIPSEND=%d", request_len);
    sendCommand(cmd, 2000, true);  // Wait for '>' prompt

    // 4. Send the HTTP GET request
    esp8266.write(http_request, request_len);
    pc.write("Sent HTTP GET request:\n", 22);
    pc.write(http_request, request_len);

    pc.write("Waiting for response:\n", 21);
    Timer timer;
    timer.start();
    bool capturing = false;
    char c;
    while (timer.elapsed_time().count() < 10000 * 1000) {
        if (esp8266.readable()) {
            esp8266.read(&c, 1);
            if (c == '!' && capturing == false) {
                capturing = true;
            } else if (c == '!' && capturing) {
                capturing = false;
                rec[rec_ctr] = '\0';
                pc.write("Captured data: ", 15);
                pc.write(rec, strlen(rec));
                pc.write("\n", 1);
                rec_ctr = 0;
            } else if (capturing && rec_ctr < sizeof(rec) - 1) {
                rec[rec_ctr++] = c;
            }
        }
    }
    timer.stop();

    sendCommand("AT+CIPCLOSE", 1000);

    for (int i = 0; i < strlen(rec); i++) {
        if (rec[i] >= '0' && rec[i] <= '9') {
            int tl_state = rec[i] - '0';
            if (tl_state > 0) {
                tl_green(tls[tl_state-1].red, tls[tl_state-1].yellow, tls[tl_state-1].green, 2000);
            } else {
                tl_red(tls[tl_state-1].red, tls[tl_state-1].yellow, tls[tl_state-1].green, 2000);
            }
        }
    }
}

int main() {
    // Initialize traffic lights with defined pins
    traffic_light tls[2] = {
        {TL1_RED, TL1_YELLOW, TL1_GREEN},
        {TL2_RED, TL2_YELLOW, TL2_GREEN}
    };

    pc.write("ESP8266 WiFi Test\n", 19);

    // Connect to WiFi
    connectToWiFi();

    pc.write("ESP8266 Initialization Complete.\n", 32);

    // Send the HTTP GET request and process traffic light states
    sendHttpRequest(tls);
}
