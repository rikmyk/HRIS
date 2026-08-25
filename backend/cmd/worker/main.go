package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	fmt.Println("Starting HRIS Worker process (Asynq background jobs)...")

	// Setup signal catching for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	done := make(chan bool, 1)

	go func() {
		for {
			select {
			case <-done:
				return
			default:
				// Worker loop heartbeat placeholder
				time.Sleep(5 * time.Second)
			}
		}
	}()

	fmt.Println("HRIS Worker is running. Press Ctrl+C to stop.")
	<-sigChan

	fmt.Println("Shutting down HRIS Worker gracefully...")
	done <- true
	log.Println("Worker process exited cleanly.")
}
