// emails/OrderNotification.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
  Row,
  Column,
} from '@react-email/components'

interface OrderItem {
  name: string
  size: number
  quantity: number
  price: number
}

interface Order {
  orderNumber: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  items: OrderItem[]
  totalAmount: number
}

interface OrderNotificationProps {
  order: Order
}

export function OrderNotification({ order }: OrderNotificationProps) {
  const {
    orderNumber,
    customerName,
    customerPhone,
    deliveryAddress,
    items,
    totalAmount: total,
  } = order

  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Heading style={{ color: '#b45309' }}>
            🛍️ New Order! #{orderNumber}
          </Heading>
          
          <Section style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
            <Text><strong>Customer:</strong> {customerName}</Text>
            <Text><strong>Phone:</strong> {customerPhone}</Text>
            <Text><strong>Delivery Address:</strong> {deliveryAddress}</Text>
          </Section>
          
          <Hr />
          
          <Heading as="h3">Order Items</Heading>
          {items.map((item, idx) => (
            <Row key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
              <Column>{item.name}</Column>
              <Column>Size: {item.size}</Column>
              <Column>Qty: {item.quantity}</Column>
              <Column style={{ textAlign: 'right' }}>
                {(item.price * item.quantity).toLocaleString()} FCFA
              </Column>
            </Row>
          ))}
          
          <Hr />
          
          <Text style={{ fontSize: '20px', fontWeight: 'bold', textAlign: 'right', color: '#b45309' }}>
            Total: {total.toLocaleString()} FCFA
          </Text>
          
          <Text style={{ color: '#6b7280', marginTop: '20px' }}>
            View and manage this order in your admin dashboard.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default OrderNotification