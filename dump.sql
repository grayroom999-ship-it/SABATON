--
-- PostgreSQL database dump
--

\restrict hvjE9fReLTa7JdUPiDFShKoL9riYLW4rkUeVVpDqce4t400m8naLilcUq2KkMbB

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Variant" DROP CONSTRAINT IF EXISTS "Variant_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."ShoeCategoryOnProduct" DROP CONSTRAINT IF EXISTS "ShoeCategoryOnProduct_shoeCategoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."ShoeCategoryOnProduct" DROP CONSTRAINT IF EXISTS "ShoeCategoryOnProduct_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_variantId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_variantId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_productId_fkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_cartId_fkey";
ALTER TABLE IF EXISTS ONLY public."AccessoryShoeCategory" DROP CONSTRAINT IF EXISTS "AccessoryShoeCategory_shoeCategoryId_fkey";
ALTER TABLE IF EXISTS ONLY public."AccessoryShoeCategory" DROP CONSTRAINT IF EXISTS "AccessoryShoeCategory_accessoryId_fkey";
DROP INDEX IF EXISTS public."Variant_sku_key";
DROP INDEX IF EXISTS public."ShoeCategory_name_key";
DROP INDEX IF EXISTS public."ShoeCategoryOnProduct_productId_shoeCategoryId_key";
DROP INDEX IF EXISTS public."Product_gender_idx";
DROP INDEX IF EXISTS public."Product_category_idx";
DROP INDEX IF EXISTS public."OrderItem_orderId_productId_variantId_key";
DROP INDEX IF EXISTS public."Cart_sessionId_key";
DROP INDEX IF EXISTS public."CartItem_cartId_productId_variantId_key";
DROP INDEX IF EXISTS public."AccessoryShoeCategory_accessoryId_shoeCategoryId_key";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Variant" DROP CONSTRAINT IF EXISTS "Variant_pkey";
ALTER TABLE IF EXISTS ONLY public."ShoeCategory" DROP CONSTRAINT IF EXISTS "ShoeCategory_pkey";
ALTER TABLE IF EXISTS ONLY public."ShoeCategoryOnProduct" DROP CONSTRAINT IF EXISTS "ShoeCategoryOnProduct_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Cart" DROP CONSTRAINT IF EXISTS "Cart_pkey";
ALTER TABLE IF EXISTS ONLY public."CartItem" DROP CONSTRAINT IF EXISTS "CartItem_pkey";
ALTER TABLE IF EXISTS ONLY public."AccessoryShoeCategory" DROP CONSTRAINT IF EXISTS "AccessoryShoeCategory_pkey";
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."Variant";
DROP TABLE IF EXISTS public."ShoeCategoryOnProduct";
DROP TABLE IF EXISTS public."ShoeCategory";
DROP TABLE IF EXISTS public."Product";
DROP TABLE IF EXISTS public."OrderItem";
DROP TABLE IF EXISTS public."Order";
DROP TABLE IF EXISTS public."CartItem";
DROP TABLE IF EXISTS public."Cart";
DROP TABLE IF EXISTS public."AccessoryShoeCategory";
DROP TYPE IF EXISTS public."ShoeCategoryName";
DROP TYPE IF EXISTS public."AccessoryType";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AccessoryType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AccessoryType" AS ENUM (
    'horn',
    'socks',
    'laces',
    'cleaner'
);


--
-- Name: ShoeCategoryName; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ShoeCategoryName" AS ENUM (
    'casual',
    'formal',
    'boots',
    'all'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AccessoryShoeCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AccessoryShoeCategory" (
    id text NOT NULL,
    "accessoryId" text NOT NULL,
    "shoeCategoryId" text NOT NULL
);


--
-- Name: Cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cart" (
    id text NOT NULL,
    "sessionId" text NOT NULL,
    "userId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CartItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CartItem" (
    id text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "productName" text,
    price double precision NOT NULL,
    "cartId" text NOT NULL,
    "productId" text NOT NULL,
    "variantId" text
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "customerId" text,
    total double precision NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    address text,
    phone text
);


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "productId" text NOT NULL,
    "orderId" text NOT NULL,
    "variantId" text
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price double precision NOT NULL,
    "imageUrl" text,
    category text,
    gender text NOT NULL,
    material text,
    "accessoryType" public."AccessoryType",
    "crossSellScore" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "hoverImageUrl" text
);


--
-- Name: ShoeCategory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShoeCategory" (
    id text NOT NULL,
    name public."ShoeCategoryName" NOT NULL
);


--
-- Name: ShoeCategoryOnProduct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ShoeCategoryOnProduct" (
    id text NOT NULL,
    "productId" text NOT NULL,
    "shoeCategoryId" text NOT NULL
);


--
-- Name: Variant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Variant" (
    id text NOT NULL,
    sku text NOT NULL,
    size integer NOT NULL,
    color text,
    price double precision,
    stock integer DEFAULT 0 NOT NULL,
    "productId" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: AccessoryShoeCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AccessoryShoeCategory" (id, "accessoryId", "shoeCategoryId") FROM stdin;
\.


--
-- Data for Name: Cart; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Cart" (id, "sessionId", "userId", "createdAt", "updatedAt") FROM stdin;
cmqje4tfj000350tejmb90tvm	session_1777822382882_h2y3h3lil	\N	2026-06-18 11:02:27.584	2026-06-18 11:02:27.584
\.


--
-- Data for Name: CartItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CartItem" (id, quantity, "productName", price, "cartId", "productId", "variantId") FROM stdin;
cmqm54ly30000koteklxwl09d	1	\N	89400	cmqje4tfj000350tejmb90tvm	cmqm4tk320008d8te2iyyxn4l	cmqm4tk330009d8teiiw7uev9
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, "customerId", total, status, "createdAt", "updatedAt", address, phone) FROM stdin;
cmqjatzz0000018tecqyi5gdw	\N	90000	pending	2026-06-18 09:30:03.996	2026-06-18 09:30:03.996	\N	\N
cmqjbb96a0001totevad1t0ra	\N	45000	pending	2026-06-18 09:43:29.075	2026-06-18 09:43:29.075	\N	\N
cmqjbpiq40001ggtejoqasfcc	\N	45000	pending	2026-06-18 09:54:34.637	2026-06-18 09:54:34.637	\N	\N
cmqje4rh0000150tevutpwwer	\N	45000	pending	2026-06-18 11:02:25.045	2026-06-18 11:02:25.045	\N	\N
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderItem" (id, quantity, price, "productId", "orderId", "variantId") FROM stdin;
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, name, description, price, "imageUrl", category, gender, material, "accessoryType", "crossSellScore", "createdAt", "updatedAt", "hoverImageUrl") FROM stdin;
cmqm4tk230003d8te519u9vf9	Classic Leather Oxford	Premium full-grain leather Oxford with high-shine finish. Closed-lacing, stacked heel, cushioned insole. Ideal for boardrooms, weddings, and black-tie events. Timeless formal staple.	78000	/images/classic-oxford.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.203	2026-06-20 09:05:04.203	/images/classic-oxford-2.jpg
cmqm4tk320008d8te2iyyxn4l	Suede Chukka Boots	Soft suede chukka boots with natural crepe rubber sole. Two-eyelet, ankle-height, cushioned footbed. Versatile smart-casual wear – city strolls, creative offices, or weekend getaways.	89400	/images/Sabaton-shoes-oslo-high-boots-last-black-calf-vibram-dainite-sole.jpg	shoe	male	suede	\N	0	2026-06-20 09:05:04.238	2026-06-20 09:05:04.238	/images/Sabaton-shoes-oslo-2-high-boots-last-black-calf-vibram-dainite-sole.jpg
cmqm4tk37000cd8teplvrh6pa	Suede Loafers	Lightweight suede-texture slip-ons with memory-foam insole and flexible rubber outsole. Breathable and cushioned. Ideal for travel, casual Fridays, and warm-weather outings.	54000	/images/SABATON-Shoes-Handcrafted-suede-.jpg	shoe	male	fabric	\N	0	2026-06-20 09:05:04.243	2026-06-20 09:05:04.243	/images/Tan-Casual-Loafer-Boot.jpg
cmqm4tk3b000gd8tehh1gzsf5	Balmoral Suede	Hand-burnished leather Balmoral with closed-lacing and cushioned leather lining. Sleek, formal silhouette. Perfect for presentations, upscale dinners, and ceremonies.	65700	/images/Sabaton-leather-suede-balmoral.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.247	2026-06-20 09:05:04.247	/images/Sabaton-leather-suede-balmoral-2.jpg
cmqm4tk3f000kd8teghqtpgk1	Budapest Bp	Classic Budapest full-grain leather with hand-stitched brogue detailing and Goodyear-welt construction. Rich patina over time. Suited for business lunches, gallery openings, and semi-formal events.	95400	/images/Brown-budapest-bp.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.251	2026-06-20 09:05:04.251	/images/Brown-Budapest-Bp-2.jpg
cmqm4tk3i000od8te6tf3nvmr	Budapest high Boots	High-top Budapest boots in premium leather with brogue detailing and stacked heel. Ankle-hugging, sturdy. Perfect for autumn, countryside, or pairing with tailored trousers.	84000	/images/SABATON-shoes-budapest-high-boots.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.254	2026-06-20 09:05:04.254	/images/SABATON-shoes-budapest-high-boots(2).jpg
cmqm4tk3m000sd8te7glupbhv	Driving Moccasins	Hand-stitched leather moccasins with pebble-rubber sole for superior pedal grip. Unlined, molds to foot. Ideal for driving, road trips, and resort lounging.	48000	/images/Balmoral-Casual-Loafer-Boot.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.258	2026-06-20 09:05:04.258	/images/Balmoral-Casual-Loafer-Boot(2).jpg
cmqm4tk3p000wd8te9qzlay3z	Derby Shoes	Open-lacing Derby in smooth full-grain leather with burnished toe. Durable leather-rubber sole, accommodates high insteps. Versatile for business-casual, outdoor weddings, and city exploring.	71400	/images/derby-shoes.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.261	2026-06-20 09:05:04.261	/images/derby-shoes-hover.jpg
cmqm4tk3s0010d8teuagr1a1n	Budapest Balmoral	Waterproof leather Budapest Balmoral with sealed seams and closed-lacing. Military-inspired elegance. Reliable grip for rainy city streets without compromising formality.	107400	/images/Budapest-Balmoral-Leather-2.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.264	2026-06-20 09:05:04.264	/images/Budapest- Balmoral-leather.jpg
cmqm4tk3v0014d8te2cubzw7h	Chukka Boots	Breathable leather chukka boots with jute-wrapped rope sole. Two-eyelet, relaxed silhouette. Great for resorts, summer festivals, and casual daytime wear.	36000	/images/shoes-chukka-boots.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.267	2026-06-20 09:05:04.267	/images/shoes-chukka-boots-2.jpg
cmqm4tk400018d8teq1lw0w4r	Cognac Antigue	Striking monk-strap shoes in rich cognac with multitone patina finish. Bold hardware, leather-lined. Modern flair for networking, cocktail parties, and creative studios.	101400	/images/SABATON-last-antique-cognac-1-.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.272	2026-06-20 09:05:04.272	/images/SABATON-last-antique-cognac.jpg
cmqm4tk43001cd8tezpkyre8k	Musuem Calf	Exquisite museum calf leather with unique mottled finish. Single comfort sole, lightweight and breathable. Artisan style for gallery openings, travel, and collectors.	101400	/images/SABATON-handcrafted-museum-calf-single-sole.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.275	2026-06-20 09:05:04.275	/images/SABATON-handcrafted-museum-calf-single-sole-2.jpg
cmqm4tk46001gd8teh1r28i3j	Black Budapest Bp	Black full-grain Budapest leather with wingtip and brogue perforations. Goodyear-welted, mirror shine. Essential for high-profile meetings, galas, and black-tie occasions.	101400	/images/Black-Budapest-Bp-2.jpg	shoe	male	leather	\N	0	2026-06-20 09:05:04.278	2026-06-20 09:05:04.278	/images/Black-Budapest-Bp.jpg
cmqm4tk48001kd8teo33qke3j	Ballet Flats	Elegant leather ballet flats with rounded toe, flexible rubber sole, and cushioned footbed. Breathable leather lining. Perfect for commuting, brunch, or weekend strolls.	53400	/images/ballet-flats.jpg	shoe	female	leather	\N	0	2026-06-20 09:05:04.28	2026-06-20 09:05:04.28	/images/ballet-flats-hover.jpg
cmqm4tk4b001od8tewsczzmgf	Ankle Boots	Chic leather ankle boots with 2-inch block heel, side zipper, and padded insole. Breathable lining. Versatile for desk-to-dinner, pairs with trousers, skirts, or jeans.	78000	/images/ankle-boots.jpg	shoe	female	leather	\N	0	2026-06-20 09:05:04.283	2026-06-20 09:05:04.283	/images/ankle-boots-hover.jpg
cmqm4tk4e001sd8teq7hp34ot	Pointed-Toe Pumps	Classic pointed-toe pumps with stiletto heel and leather lining. Padded footbed reduces pressure. Ideal for boardrooms, galas, weddings, and cocktail receptions.	65700	/images/pumps.jpg	shoe	female	leather	\N	0	2026-06-20 09:05:04.286	2026-06-20 09:05:04.286	/images/pumps-hover.jpg
cmqm4tk4g001wd8te7idsfq9a	Platform Sandals	Trendy fabric platform sandals with 1.5-inch sole, adjustable ankle strap, and contoured foam footbed. Stable and cushioned. Great for festivals, beach, or rooftop parties.	45000	/images/platform-sandals.jpg	shoe	female	fabric	\N	0	2026-06-20 09:05:04.288	2026-06-20 09:05:04.288	/images/platform-sandals-hover.jpg
cmqm4tk4m0020d8te8z550szh	Petra Leather Boots	Full-grain brown leather Petra boots with mid-calf shaft, chunky stacked heel, and side zipper. Cushioned insole. Pairs with dresses, skirts, or denim for city or evening wear.	98500	/images/Sabaton-petra-boots-brown-Buea.jpg	shoe	female	leather	\N	0	2026-06-20 09:05:04.294	2026-06-20 09:05:04.294	/images/Sabaton-women-petra-boots-petra.jpg
cmqm4tk4s0025d8te71o6kqib	Casual Leather Slip‑Ons	Soft pebbled leather slip-ons with memory-foam footbed, breathable lining, and lightweight rubber outsole. Minimalist, quiet, and cushioned. Ideal for coffee runs or relaxed office days.	62400	/images/SABATON-Casual-Women-Leather.jpg	shoe	female	leather	\N	0	2026-06-20 09:05:04.3	2026-06-20 09:05:04.3	/images/SABATON-Casual-Women-Leather.jpg
cmqm4tk4x002ad8tegyrwj57s	Saddle Oxford Formal Shoes	Polished saddle oxfords with contrasting panel, closed-lacing, slightly pointed toe, and 1-inch heel. Leather outsole. Refined choice for boardrooms, luncheons, and elegant evenings.	87600	/images/SABATON-women-fomal-saddle-oxford-2-.jpg	shoe	female	leather	\N	0	2026-06-20 09:05:04.305	2026-06-20 09:05:04.305	/images/SABATON-women-fomal-saddle-oxford-2-.jpg
cmqm4tk53002fd8tehzt1czqv	Block‑Heel Leather Pumps	Polished leather pumps with 2.5-inch block heel, rounded toe, cushioned footbed, and rubber heel cap. Contemporary side cut-out. Perfect for power lunches, weddings, or office wear.	72300	/images/SABATON-women-block-heel-pumps.jpg	shoe	female	leather	\N	0	2026-06-20 09:05:04.311	2026-06-20 09:05:04.311	/images/SABATON-women-block-heel-pumps-hover.jpg
\.


--
-- Data for Name: ShoeCategory; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShoeCategory" (id, name) FROM stdin;
cmqm4tk0z0000d8tetj6fgg6o	formal
cmqm4tk1b0001d8teio61te2j	casual
cmqm4tk1c0002d8teupwsp8gf	boots
\.


--
-- Data for Name: ShoeCategoryOnProduct; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ShoeCategoryOnProduct" (id, "productId", "shoeCategoryId") FROM stdin;
cmqm4tk2q0007d8tenzfns9v9	cmqm4tk230003d8te519u9vf9	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk34000bd8telwcnmlya	cmqm4tk320008d8te2iyyxn4l	cmqm4tk1c0002d8teupwsp8gf
cmqm4tk3a000fd8te665espdv	cmqm4tk37000cd8teplvrh6pa	cmqm4tk1b0001d8teio61te2j
cmqm4tk3d000jd8tepx8t2yhk	cmqm4tk3b000gd8tehh1gzsf5	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk3h000nd8teuqkwp8ms	cmqm4tk3f000kd8teghqtpgk1	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk3l000rd8tegqidwwmn	cmqm4tk3i000od8te6tf3nvmr	cmqm4tk1c0002d8teupwsp8gf
cmqm4tk3n000vd8teg456fkp3	cmqm4tk3m000sd8te7glupbhv	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk3q000zd8tesgjnvgwu	cmqm4tk3p000wd8te9qzlay3z	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk3u0013d8tecj4bb0nz	cmqm4tk3s0010d8teuagr1a1n	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk3z0017d8teb8vedt8z	cmqm4tk3v0014d8te2cubzw7h	cmqm4tk1c0002d8teupwsp8gf
cmqm4tk42001bd8teefalqvr2	cmqm4tk400018d8teq1lw0w4r	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk45001fd8te3pfytb20	cmqm4tk43001cd8tezpkyre8k	cmqm4tk1b0001d8teio61te2j
cmqm4tk47001jd8teg69gl1wa	cmqm4tk46001gd8teh1r28i3j	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk4a001nd8tegjf8njlo	cmqm4tk48001kd8teo33qke3j	cmqm4tk1b0001d8teio61te2j
cmqm4tk4d001rd8tew7nixxfh	cmqm4tk4b001od8tewsczzmgf	cmqm4tk1c0002d8teupwsp8gf
cmqm4tk4f001vd8teszxvqflm	cmqm4tk4e001sd8teq7hp34ot	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk4i001zd8tebbo4wa0o	cmqm4tk4g001wd8te7idsfq9a	cmqm4tk1b0001d8teio61te2j
cmqm4tk4o0024d8te0joxc6vb	cmqm4tk4m0020d8te8z550szh	cmqm4tk1c0002d8teupwsp8gf
cmqm4tk4u0029d8teg79xwr7s	cmqm4tk4s0025d8te71o6kqib	cmqm4tk1b0001d8teio61te2j
cmqm4tk4z002ed8tew5ede8fz	cmqm4tk4x002ad8tegyrwj57s	cmqm4tk0z0000d8tetj6fgg6o
cmqm4tk56002jd8te0cu9scrf	cmqm4tk53002fd8tehzt1czqv	cmqm4tk0z0000d8tetj6fgg6o
\.


--
-- Data for Name: Variant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Variant" (id, sku, size, color, price, stock, "productId") FROM stdin;
cmqm4tk2e0004d8texmjddl06	classic-leather-oxfo-8-bla-t0q2	8	Black	78000	20	cmqm4tk230003d8te519u9vf9
cmqm4tk2e0005d8te1isdughz	classic-leather-oxfo-9-bla-jc14	9	Black	78000	25	cmqm4tk230003d8te519u9vf9
cmqm4tk2e0006d8teoekg6lq5	classic-leather-oxfo-10-bro-qi3y	10	Brown	78000	15	cmqm4tk230003d8te519u9vf9
cmqm4tk330009d8teiiw7uev9	suede-chukka-boots-9-bla-noav	9	Black	89400	18	cmqm4tk320008d8te2iyyxn4l
cmqm4tk33000ad8teanhusdv2	suede-chukka-boots-10-gre-k9qt	10	Grey	89400	12	cmqm4tk320008d8te2iyyxn4l
cmqm4tk38000dd8teruhudt4j	suede-loafers-10-tan-vhax	10	Tan	54000	30	cmqm4tk37000cd8teplvrh6pa
cmqm4tk38000ed8te6smtg3fm	suede-loafers-11-bla-kjon	11	Black	54000	22	cmqm4tk37000cd8teplvrh6pa
cmqm4tk3b000hd8te3is8hp1o	balmoral-suede-8-bro-54rk	8	Brown	65700	14	cmqm4tk3b000gd8tehh1gzsf5
cmqm4tk3b000id8teotjepwu6	balmoral-suede-9-bla-s64x	9	Black	65700	19	cmqm4tk3b000gd8tehh1gzsf5
cmqm4tk3g000ld8ten1u90l98	budapest-bp-9-bro-esq7	9	Brown	95400	10	cmqm4tk3f000kd8teghqtpgk1
cmqm4tk3g000md8te2ax8wseq	budapest-bp-10-bla-u6z3	10	Black	95400	8	cmqm4tk3f000kd8teghqtpgk1
cmqm4tk3j000pd8te8bnws0i2	budapest-high-boots-9-bla-epox	9	Black	84000	16	cmqm4tk3i000od8te6tf3nvmr
cmqm4tk3j000qd8tehayj9omm	budapest-high-boots-10-bro-eovq	10	Brown	84000	13	cmqm4tk3i000od8te6tf3nvmr
cmqm4tk3m000td8teiuy8rj8l	driving-moccasins-8-bro-qsri	8	Brown	48000	25	cmqm4tk3m000sd8te7glupbhv
cmqm4tk3m000ud8tef1sc7xcm	driving-moccasins-9-gre-08fn	9	Grey	48000	20	cmqm4tk3m000sd8te7glupbhv
cmqm4tk3p000xd8teqd2zxu2g	derby-shoes-10-bla-qcqc	10	Black	71400	12	cmqm4tk3p000wd8te9qzlay3z
cmqm4tk3p000yd8te43wdjv2o	derby-shoes-11-bro-8l07	11	Brown	71400	9	cmqm4tk3p000wd8te9qzlay3z
cmqm4tk3s0011d8te3mrzpg56	budapest-balmoral-10-bro-lp0n	10	Brown	107400	11	cmqm4tk3s0010d8teuagr1a1n
cmqm4tk3s0012d8tem93vcliu	budapest-balmoral-11-oli-rqir	11	Olive	107400	7	cmqm4tk3s0010d8teuagr1a1n
cmqm4tk3w0015d8teym82oub1	chukka-boots-9-bei-9u8p	9	Beige	36000	30	cmqm4tk3v0014d8te2cubzw7h
cmqm4tk3w0016d8tel19bljhr	chukka-boots-10-nav-e4my	10	Navy	36000	28	cmqm4tk3v0014d8te2cubzw7h
cmqm4tk400019d8te92hch04i	cognac-antigue-8-bro-3eal	8	Brown	101400	10	cmqm4tk400018d8teq1lw0w4r
cmqm4tk40001ad8tepnxh6oty	cognac-antigue-9-bla-ddtu	9	Black	101400	12	cmqm4tk400018d8teq1lw0w4r
cmqm4tk44001dd8tedzwlb7jt	musuem-calf-8-bro-4el7	8	Brown	101400	10	cmqm4tk43001cd8tezpkyre8k
cmqm4tk44001ed8tebbpqcc28	musuem-calf-9-bla-dthn	9	Black	101400	12	cmqm4tk43001cd8tezpkyre8k
cmqm4tk46001hd8te6fhwt0dk	black-budapest-bp-8-bro-k2w8	8	Brown	101400	10	cmqm4tk46001gd8teh1r28i3j
cmqm4tk46001id8tes0yp2g2i	black-budapest-bp-9-bla-tw5b	9	Black	101400	12	cmqm4tk46001gd8teh1r28i3j
cmqm4tk48001ld8te78183xot	ballet-flats-6-bla-dvgt	6	Black	53400	20	cmqm4tk48001kd8teo33qke3j
cmqm4tk48001md8tencjcjzk3	ballet-flats-7-nud-jdmk	7	Nude	53400	18	cmqm4tk48001kd8teo33qke3j
cmqm4tk4b001pd8temu3brzgv	ankle-boots-6-bla-qv58	6	Black	78000	15	cmqm4tk4b001od8tewsczzmgf
cmqm4tk4b001qd8tei20x55so	ankle-boots-7-tan-k9e8	7	Tan	78000	10	cmqm4tk4b001od8tewsczzmgf
cmqm4tk4e001td8tekgj5asqn	pointed-toe-pumps-6-bla-osfg	6	Black	65700	12	cmqm4tk4e001sd8teq7hp34ot
cmqm4tk4e001ud8telemlyw4z	pointed-toe-pumps-7-red-r33z	7	Red	65700	8	cmqm4tk4e001sd8teq7hp34ot
cmqm4tk4h001xd8ted8n8y8no	platform-sandals-7-whi-qcr8	7	White	45000	22	cmqm4tk4g001wd8te7idsfq9a
cmqm4tk4h001yd8teaoyg8ym4	platform-sandals-8-gol-pbe4	8	Gold	45000	14	cmqm4tk4g001wd8te7idsfq9a
cmqm4tk4m0021d8tehkarhm98	petra-leather-boots-6-bro-e1q5	6	Brown	98500	12	cmqm4tk4m0020d8te8z550szh
cmqm4tk4m0022d8teiavwdujr	petra-leather-boots-7-bro-0d05	7	Brown	98500	15	cmqm4tk4m0020d8te8z550szh
cmqm4tk4m0023d8teqw0t8g4u	petra-leather-boots-8-bro-mscx	8	Brown	98500	10	cmqm4tk4m0020d8te8z550szh
cmqm4tk4s0026d8te1h0vod9j	casual-leather-slip‑-6-bla-x2g7	6	Black	62400	20	cmqm4tk4s0025d8te71o6kqib
cmqm4tk4s0027d8teomyk7ed1	casual-leather-slip‑-7-tan-sh52	7	Tan	62400	18	cmqm4tk4s0025d8te71o6kqib
cmqm4tk4s0028d8te7jyr2t3l	casual-leather-slip‑-8-bla-33iq	8	Black	62400	14	cmqm4tk4s0025d8te71o6kqib
cmqm4tk4x002bd8tem4illcj7	saddle-oxford-formal-6-bla-gbuq	6	Black/White	87600	9	cmqm4tk4x002ad8tegyrwj57s
cmqm4tk4x002cd8tejanqpiz9	saddle-oxford-formal-7-bla-6d3r	7	Black/White	87600	11	cmqm4tk4x002ad8tegyrwj57s
cmqm4tk4x002dd8tenado1c3u	saddle-oxford-formal-8-bla-c67o	8	Black/White	87600	7	cmqm4tk4x002ad8tegyrwj57s
cmqm4tk54002gd8teyxjgr2hu	block‑heel-leather-p-6-bla-v7cl	6	Black	72300	16	cmqm4tk53002fd8tehzt1czqv
cmqm4tk54002hd8te3vos3ddw	block‑heel-leather-p-7-nav-ei5i	7	Navy	72300	12	cmqm4tk53002fd8tehzt1czqv
cmqm4tk54002id8tef92mdkt1	block‑heel-leather-p-8-bla-ejsi	8	Black	72300	14	cmqm4tk53002fd8tehzt1czqv
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c4e66e3a-9f4b-4fa9-ae3a-cbc66b14c368	a7e5775f488d26d30c25c24ead414e7ba1d4fe346c0738c17d2b161fc499c02a	2026-06-09 13:29:48.839533+01	20260609122948_add_full_cross_sell_with_shoe_categories	\N	\N	2026-06-09 13:29:48.755038+01	1
\.


--
-- Name: AccessoryShoeCategory AccessoryShoeCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AccessoryShoeCategory"
    ADD CONSTRAINT "AccessoryShoeCategory_pkey" PRIMARY KEY (id);


--
-- Name: CartItem CartItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_pkey" PRIMARY KEY (id);


--
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: ShoeCategoryOnProduct ShoeCategoryOnProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShoeCategoryOnProduct"
    ADD CONSTRAINT "ShoeCategoryOnProduct_pkey" PRIMARY KEY (id);


--
-- Name: ShoeCategory ShoeCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShoeCategory"
    ADD CONSTRAINT "ShoeCategory_pkey" PRIMARY KEY (id);


--
-- Name: Variant Variant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Variant"
    ADD CONSTRAINT "Variant_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AccessoryShoeCategory_accessoryId_shoeCategoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AccessoryShoeCategory_accessoryId_shoeCategoryId_key" ON public."AccessoryShoeCategory" USING btree ("accessoryId", "shoeCategoryId");


--
-- Name: CartItem_cartId_productId_variantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON public."CartItem" USING btree ("cartId", "productId", "variantId");


--
-- Name: Cart_sessionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Cart_sessionId_key" ON public."Cart" USING btree ("sessionId");


--
-- Name: OrderItem_orderId_productId_variantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OrderItem_orderId_productId_variantId_key" ON public."OrderItem" USING btree ("orderId", "productId", "variantId");


--
-- Name: Product_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_category_idx" ON public."Product" USING btree (category);


--
-- Name: Product_gender_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_gender_idx" ON public."Product" USING btree (gender);


--
-- Name: ShoeCategoryOnProduct_productId_shoeCategoryId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShoeCategoryOnProduct_productId_shoeCategoryId_key" ON public."ShoeCategoryOnProduct" USING btree ("productId", "shoeCategoryId");


--
-- Name: ShoeCategory_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ShoeCategory_name_key" ON public."ShoeCategory" USING btree (name);


--
-- Name: Variant_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Variant_sku_key" ON public."Variant" USING btree (sku);


--
-- Name: AccessoryShoeCategory AccessoryShoeCategory_accessoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AccessoryShoeCategory"
    ADD CONSTRAINT "AccessoryShoeCategory_accessoryId_fkey" FOREIGN KEY ("accessoryId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AccessoryShoeCategory AccessoryShoeCategory_shoeCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AccessoryShoeCategory"
    ADD CONSTRAINT "AccessoryShoeCategory_shoeCategoryId_fkey" FOREIGN KEY ("shoeCategoryId") REFERENCES public."ShoeCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_cartId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES public."Cart"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CartItem CartItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CartItem CartItem_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CartItem"
    ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public."Variant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_variantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES public."Variant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ShoeCategoryOnProduct ShoeCategoryOnProduct_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShoeCategoryOnProduct"
    ADD CONSTRAINT "ShoeCategoryOnProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ShoeCategoryOnProduct ShoeCategoryOnProduct_shoeCategoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ShoeCategoryOnProduct"
    ADD CONSTRAINT "ShoeCategoryOnProduct_shoeCategoryId_fkey" FOREIGN KEY ("shoeCategoryId") REFERENCES public."ShoeCategory"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Variant Variant_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Variant"
    ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict hvjE9fReLTa7JdUPiDFShKoL9riYLW4rkUeVVpDqce4t400m8naLilcUq2KkMbB

