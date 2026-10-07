-- ==============================================================================
-- CULTURESQUARED E-COMMERCE - SUPABASE DATABASE SCHEMA
-- ==============================================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. TABLES DEFINITION
-- ==============================================================================

-- Table: profiles
-- Linked to Supabase auth.users
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    name text,
    email text,
    phone text,
    address text,
    created_at timestamptz default now()
);

-- Table: products
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    price numeric not null check (price >= 0),
    category text,
    image text,
    stock integer default 0 check (stock >= 0),
    created_at timestamptz default now()
);

-- Table: wishlist
create table if not exists public.wishlist (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete cascade not null,
    created_at timestamptz default now(),
    unique(user_id, product_id)
);

-- Table: cart
create table if not exists public.cart (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete cascade not null,
    size text not null,
    quantity integer not null default 1 check (quantity > 0),
    created_at timestamptz default now(),
    unique(user_id, product_id, size)
);

-- Table: orders
-- Statuses: Pending, Processing, Shipped, Completed, Cancelled
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    total numeric not null check (total >= 0),
    status text not null default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled')),
    shipping_address text not null,
    created_at timestamptz default now()
);

-- Table: order_items
create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid references public.orders(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete set null,
    size text not null,
    quantity integer not null default 1 check (quantity > 0),
    price numeric not null check (price >= 0)
);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.wishlist enable row level security;
alter table public.cart enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles Policies
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

-- Products Policies (Publicly readable, write-protected)
create policy "Anyone can view products"
    on public.products for select
    using (true);

-- Wishlist Policies (Restricted to item owner)
create policy "Users can view own wishlist"
    on public.wishlist for select
    using (auth.uid() = user_id);

create policy "Users can insert into own wishlist"
    on public.wishlist for insert
    with check (auth.uid() = user_id);

create policy "Users can delete from own wishlist"
    on public.wishlist for delete
    using (auth.uid() = user_id);

-- Cart Policies (Restricted to item owner)
create policy "Users can view own cart"
    on public.cart for select
    using (auth.uid() = user_id);

create policy "Users can insert into own cart"
    on public.cart for insert
    with check (auth.uid() = user_id);

create policy "Users can update own cart"
    on public.cart for update
    using (auth.uid() = user_id);

create policy "Users can delete from own cart"
    on public.cart for delete
    using (auth.uid() = user_id);

-- Orders Policies (Restricted to order owner)
create policy "Users can view own orders"
    on public.orders for select
    using (auth.uid() = user_id);

create policy "Users can create own orders"
    on public.orders for insert
    with check (auth.uid() = user_id);

-- Order Items Policies (Restricted to items belonging to user's orders)
create policy "Users can view own order items"
    on public.order_items for select
    using (
        exists (
            select 1 from public.orders
            where public.orders.id = public.order_items.order_id
            and public.orders.user_id = auth.uid()
        )
    );

create policy "Users can create own order items"
    on public.order_items for insert
    with check (
        exists (
            select 1 from public.orders
            where public.orders.id = public.order_items.order_id
            and public.orders.user_id = auth.uid()
        )
    );

-- ==============================================================================
-- 4. AUTOMATIC PROFILE CREATION TRIGGER
-- ==============================================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, name, email, phone)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', ''),
        new.email,
        coalesce(new.raw_user_meta_data->>'phone', '')
    );
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ==============================================================================
-- 5. INITIAL PRODUCT SEED DATA
-- Note: Derived from existing CultureSquared catalog.
-- ==============================================================================

insert into public.products (name, description, price, category, image, stock)
values 
(
    'CultureSquared Basic Black',
    'Lightweight everyday streetwear boardshorts engineered for maximum comfort and durability.',
    85000,
    'Men''s BoardShorts',
    'assets/shorts_1.png',
    50
),
(
    'CultureSquared Fatigue Short Black',
    'Signature streetwear fatigue shorts crafted from premium durable cotton with utilitarian aesthetic.',
    85000,
    'Men''s Streetwear Shorts',
    'assets/shorts_2.png',
    50
)
on conflict do nothing;
