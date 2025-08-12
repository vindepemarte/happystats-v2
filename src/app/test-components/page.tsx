// Test page for UI components

"use client";

import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Modal, ModalFooter } from '../../components/ui/Modal';
import { LoadingSpinner, LoadingPage, LoadingInline } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorBoundary';
import { Header } from '../../components/layout/Header';
import { Navigation } from '../../components/layout/Navigation';

export default function TestComponentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (e.target.value.length < 3) {
      setInputError('Must be at least 3 characters');
    } else {
      setInputError('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Component Testing
          </h1>
          <p className="text-muted-foreground">
            Testing mobile-first responsive components (resize window to test)
          </p>
        </div>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>Different button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs</CardTitle>
            <CardDescription>Form inputs with validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              helperText="We'll never share your email"
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              leftIcon={
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2-2V7a3 3 0 016 0v4a2 2 0 002 2v6a2 2 0 01-2 2z" />
                </svg>
              }
            />
            
            <Input
              label="Test Input"
              value={inputValue}
              onChange={handleInputChange}
              error={inputError}
              placeholder="Type at least 3 characters"
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
            <CardDescription>Sidebar and tab navigation styles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium mb-3">Sidebar Style</h4>
              <Navigation variant="sidebar" />
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Tab Style</h4>
              <Navigation variant="tabs" />
            </div>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card>
          <CardHeader>
            <CardTitle>Loading States</CardTitle>
            <CardDescription>Different loading indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="md" />
              <LoadingSpinner size="lg" />
            </div>
            
            <LoadingInline message="Loading data..." />
            
            <div className="border rounded-lg p-4">
              <LoadingPage message="Loading full page..." />
            </div>
          </CardContent>
        </Card>

        {/* Error States */}
        <Card>
          <CardHeader>
            <CardTitle>Error States</CardTitle>
            <CardDescription>Error message components</CardDescription>
          </CardHeader>
          <CardContent>
            <ErrorMessage
              title="Validation Error"
              message="Please check your input and try again."
              action={{
                label: "Retry",
                onClick: () => alert("Retry clicked")
              }}
            />
          </CardContent>
        </Card>

        {/* Modal */}
        <Card>
          <CardHeader>
            <CardTitle>Modal</CardTitle>
            <CardDescription>Modal dialog component</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)}>
              Open Modal
            </Button>
          </CardContent>
        </Card>

        {/* Responsive Grid */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Grid</CardTitle>
            <CardDescription>Grid layout that adapts to screen size</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-muted p-4 rounded-lg text-center">
                  <h4 className="font-medium">Card {i}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Responsive grid item
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Test Modal"
        description="This is a test modal to demonstrate the component"
      >
        <div className="space-y-4">
          <p>This modal is fully responsive and works great on mobile devices.</p>
          <Input
            label="Test Input"
            placeholder="Try typing here"
          />
        </div>
        
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsModalOpen(false)}>
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}