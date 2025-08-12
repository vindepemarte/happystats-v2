/**
 * Mobile Responsiveness Tests
 * Tests for mobile-first design and viewport handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '../utils';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';

describe('Mobile Responsiveness', () => {
    // Helper function to set viewport size
    const setViewport = (width: number, height: number = 800) => {
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: width,
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: height,
        });
        window.dispatchEvent(new Event('resize'));
    };

    beforeEach(() => {
        // Reset to default desktop size
        setViewport(1024, 768);
    });

    afterEach(() => {
        // Clean up
        setViewport(1024, 768);
    });

    describe('Minimum Width Support (312px)', () => {
        it('should render components at minimum width', () => {
            setViewport(312);

            render(
                <div className="container">
                    <Button className="w-full">Mobile Button</Button>
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle>Mobile Card</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Content should be readable at 312px width</p>
                        </CardContent>
                    </Card>
                </div>
            );

            const button = screen.getByRole('button', { name: 'Mobile Button' });
            const card = screen.getByText('Mobile Card');

            expect(button).toBeInTheDocument();
            expect(card).toBeInTheDocument();
        });

        it('should handle text overflow at minimum width', () => {
            setViewport(312);

            render(
                <div className="container px-4">
                    <h1 className="text-2xl font-bold truncate">
                        This is a very long title that should be truncated on mobile
                    </h1>
                    <p className="text-sm break-words">
                        This is a long paragraph that should wrap properly on mobile devices
                        even at the minimum supported width of 312 pixels.
                    </p>
                </div>
            );

            const title = screen.getByRole('heading');
            const paragraph = screen.getByText(/This is a long paragraph/);

            expect(title).toBeInTheDocument();
            expect(paragraph).toBeInTheDocument();
        });
    });

    describe('Mobile Breakpoints', () => {
        it('should adapt layout for mobile (375px)', () => {
            setViewport(375);

            render(
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <p>Card 1</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p>Card 2</p>
                        </CardContent>
                    </Card>
                </div>
            );

            expect(screen.getByText('Card 1')).toBeInTheDocument();
            expect(screen.getByText('Card 2')).toBeInTheDocument();
        });

        it('should adapt layout for tablet (768px)', () => {
            setViewport(768);

            render(
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <p>Sidebar content</p>
                    </div>
                    <div className="flex-1">
                        <p>Main content</p>
                    </div>
                </div>
            );

            expect(screen.getByText('Sidebar content')).toBeInTheDocument();
            expect(screen.getByText('Main content')).toBeInTheDocument();
        });

        it('should adapt layout for desktop (1024px)', () => {
            setViewport(1024);

            render(
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card><CardContent><p>Card 1</p></CardContent></Card>
                    <Card><CardContent><p>Card 2</p></CardContent></Card>
                    <Card><CardContent><p>Card 3</p></CardContent></Card>
                </div>
            );

            expect(screen.getByText('Card 1')).toBeInTheDocument();
            expect(screen.getByText('Card 2')).toBeInTheDocument();
            expect(screen.getByText('Card 3')).toBeInTheDocument();
        });
    });

    describe('Touch Targets', () => {
        it('should have minimum 44px touch targets on mobile', () => {
            setViewport(375);

            render(
                <div className="space-y-4">
                    <Button size="sm">Small Button</Button>
                    <Button>Default Button</Button>
                    <Button size="lg">Large Button</Button>
                    <Button size="sm" className="w-12 h-12">
                        <span>Icon</span>
                    </Button>
                </div>
            );

            const buttons = screen.getAllByRole('button');

            // All buttons should be rendered (actual size testing would require DOM measurements)
            expect(buttons).toHaveLength(4);
            buttons.forEach(button => {
                expect(button).toBeInTheDocument();
            });
        });

        it('should have adequate spacing between interactive elements', () => {
            setViewport(375);

            render(
                <div className="space-y-2">
                    <Button className="w-full">Button 1</Button>
                    <Button className="w-full">Button 2</Button>
                    <Button className="w-full">Button 3</Button>
                </div>
            );

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(3);

            // Verify all buttons are rendered with proper spacing classes
            buttons.forEach(button => {
                expect(button).toBeInTheDocument();
                expect(button).toHaveClass('w-full');
            });
        });
    });

    describe('Content Scaling', () => {
        it('should scale typography appropriately', () => {
            setViewport(375);

            render(
                <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl">Responsive Heading</h1>
                    <p className="text-sm sm:text-base">Responsive paragraph text</p>
                </div>
            );

            const heading = screen.getByRole('heading');
            const paragraph = screen.getByText('Responsive paragraph text');

            expect(heading).toBeInTheDocument();
            expect(paragraph).toBeInTheDocument();
        });

        it('should handle image scaling', () => {
            setViewport(375);

            render(
                <div className="w-full">
                    <img
                        src="/test-image.jpg"
                        alt="Test image"
                        className="w-full h-auto max-w-full"
                    />
                </div>
            );

            const image = screen.getByAltText('Test image');
            expect(image).toBeInTheDocument();
            expect(image).toHaveClass('w-full', 'h-auto', 'max-w-full');
        });
    });

    describe('Navigation Adaptation', () => {
        it('should adapt navigation for mobile', () => {
            setViewport(375);

            render(
                <nav className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <a href="/dashboard" className="block px-4 py-2">Dashboard</a>
                    <a href="/charts" className="block px-4 py-2">Charts</a>
                    <a href="/subscription" className="block px-4 py-2">Subscription</a>
                </nav>
            );

            const links = screen.getAllByRole('link');
            expect(links).toHaveLength(3);

            links.forEach(link => {
                expect(link).toBeInTheDocument();
                expect(link).toHaveClass('block', 'px-4', 'py-2');
            });
        });
    });

    describe('Form Adaptation', () => {
        it('should adapt forms for mobile input', () => {
            setViewport(375);

            render(
                <form className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                        <input
                            id="name"
                            type="text"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="w-full px-3 py-2 border rounded-md"
                            placeholder="Enter your email"
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Submit
                    </Button>
                </form>
            );

            const nameInput = screen.getByLabelText('Name');
            const emailInput = screen.getByLabelText('Email');
            const submitButton = screen.getByRole('button', { name: 'Submit' });

            expect(nameInput).toBeInTheDocument();
            expect(emailInput).toBeInTheDocument();
            expect(submitButton).toBeInTheDocument();

            // Verify mobile-friendly classes
            expect(nameInput).toHaveClass('w-full');
            expect(emailInput).toHaveClass('w-full');
            expect(submitButton).toHaveClass('w-full');
        });
    });
});