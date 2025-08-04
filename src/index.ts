import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { json } from 'body-parser';

const app = express();
const prisma = new PrismaClient();
const port = 3000;

// Middleware
app.use(json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4202');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
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

interface UserInput {
  name: string;
  email: string;
  phone: string;
}

interface OwnerInput {
  name: string;
  email: string;
  phone: string;
}

// CRUD for Users
// =============================================================================

// Create a new user
app.post('/users', async (req: Request<{}, {}, UserInput>, res: Response) => {
  const { name, email, phone } = req.body;
  try {
    const user = await prisma.users.create({
      data: { name, email, phone },
    });
    res.status(201).json(user);
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read all users with their bookings
app.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.users.findMany({
      include: {
        bookings: true, // This is the key change to include the bookings array
      },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read a single user by ID with their bookings
app.get('/users/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(id) },
      include: {
        bookings: true, // This is the key change to include the bookings array
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a user
app.put('/users/:id', async (req: Request<{ id: string }, {}, UserInput>, res: Response) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const user = await prisma.users.update({
      where: { user_id: parseInt(id) },
      data: { name, email, phone },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a user
app.delete('/users/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.users.delete({
      where: { user_id: parseInt(id) },
    });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    // If there's a foreign key constraint error, inform the user
    if ((error as any).code === 'P2003') {
        return res.status(409).json({ error: 'Cannot delete user with existing bookings. Please delete the bookings first.' });
    }
    res.status(500).json({ error: (error as Error).message });
  }
});









// CRUD for Owners
// =============================================================================

// Create a new owner
app.post('/owners', async (req: Request<{}, {}, OwnerInput>, res: Response) => {
  const { name, email, phone } = req.body;
  try {
    const owner = await prisma.owners.create({
      data: { name, email, phone },
    });
    res.status(201).json(owner);
  } catch (error) {
    if ((error as any).code === 'P2002') {
      return res.status(409).json({ error: 'A owner with this email already exists.' });
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read all owners with their tractors
app.get('/owners', async (req: Request, res: Response) => {
  try {
    const owners = await prisma.owners.findMany({
      include: {
        tractors: true, // This is the key change to include the tractors array
      },
    });
    res.json(owners);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Read a single owner by ID with their tractors
app.get('/owners/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    const owner = await prisma.owners.findUnique({
      where: { owner_id: parseInt(id) },
      include: {
        tractors: true, // This is the key change to include the tractors array
      },
    });
    if (!owner) {
      return res.status(404).json({ error: 'Owner not found' });
    }
    res.json(owner);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update a owner
app.put('/owners/:id', async (req: Request<{ id: string }, {}, OwnerInput>, res: Response) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const owner = await prisma.owners.update({
      where: { owner_id: parseInt(id) },
      data: { name, email, phone },
    });
    res.json(owner);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete a owner
app.delete('/owners/:id', async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.owners.delete({
      where: { owner_id: parseInt(id) },
    });
    res.json({ message: 'Owner deleted successfully' });
  } catch (error) {
    // If there's a foreign key constraint error, inform the user
    if ((error as any).code === 'P2003') {
        return res.status(409).json({ error: 'Cannot delete owner with existing tractors. Please delete the tractors first.' });
    }
    res.status(500).json({ error: (error as Error).message });
  }
});

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