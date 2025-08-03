import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { json } from 'body-parser';

const app = express();
const prisma = new PrismaClient();
const port = 3000;

// Middleware
app.use(json());

// Types
interface TractorInput {
  owner_id: number;
  brand: string;
  model: string;
  year: number;
  location: string;
  price_per_day: number;
  availability_status: string;
}

interface BookingInput {
  tractor_id: number;
  user_id: number;
  booking_date: Date;
  start_date: Date;
  end_date: Date;
  booking_method: string;
}

// CRUD for Tractors

// Create a new tractor
app.post('/tractors', async (req: Request<{}, {}, TractorInput>, res: Response) => {
  const { owner_id, brand, model, year, location, price_per_day, availability_status } = req.body;
  try {
    const tractor = await prisma.tractors.create({
      data: { owner_id, brand, model, year, location, price_per_day, availability_status },
    });
    res.status(201).json(tractor);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read all tractors
app.get('/tractors', async (req: Request, res: Response) => {
  try {
    const tractors = await prisma.tractors.findMany();
    res.json(tractors);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read a single tractor by ID
app.get('/tractors/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    const tractor = await prisma.tractors.findUnique({
      where: { tractor_id: parseInt(id) },
    });
    if (!tractor) {
      return res.status(404).json({ error: 'Tractor not found' });
    }
    res.json(tractor);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a tractor
app.put('/tractors/:id', async (req: Request<{ id: string }, {}, TractorInput>, res: Response) => {
  const { id } = req.params;
  const { owner_id, brand, model, year, location, price_per_day, availability_status } = req.body;
  try {
    const tractor = await prisma.tractors.update({
      where: { tractor_id: parseInt(id) },
      data: { owner_id, brand, model, year, location, price_per_day, availability_status },
    });
    res.json(tractor);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a tractor
app.delete('/tractors/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.tractors.delete({
      where: { tractor_id: parseInt(id) },
    });
    res.json({ message: 'Tractor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// CRUD for Bookings

// Create a new booking
app.post('/bookings', async (req: Request<{}, {}, BookingInput>, res: Response) => {
  const { tractor_id, user_id, booking_date, start_date, end_date, booking_method } = req.body;
  try {
    const booking = await prisma.bookings.create({
      data: { tractor_id, user_id, booking_date, start_date, end_date, booking_method, status: 'pending' },
    });
    await prisma.tractors.update({
      where: { tractor_id },
      data: { availability_status: 'booked' },
    });
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read all bookings
app.get('/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await prisma.bookings.findMany();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read a single booking by ID
app.get('/bookings/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    const booking = await prisma.bookings.findUnique({
      where: { booking_id: parseInt(id) },
    });
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a booking (e.g., owner confirms or cancels)
app.put('/bookings/:id', async (req: Request<{ id: string }, {}, { status: string }>, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const booking = await prisma.bookings.update({
      where: { booking_id: parseInt(id) },
      data: { status },
    });
    if (status === 'cancelled') {
      const tractor = await prisma.bookings.findUnique({
        where: { booking_id: parseInt(id) },
        select: { tractor_id: true },
      });
      await prisma.tractors.update({
        where: { tractor_id: tractor!.tractor_id },
        data: { availability_status: 'available' },
      });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a booking
app.delete('/bookings/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    const booking = await prisma.bookings.findUnique({
      where: { booking_id: parseInt(id) },
      select: { tractor_id: true },
    });
    await prisma.bookings.delete({
      where: { booking_id: parseInt(id) },
    });
    if (booking?.tractor_id) {
      await prisma.tractors.update({
        where: { tractor_id: booking.tractor_id },
        data: { availability_status: 'available' },
      });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});