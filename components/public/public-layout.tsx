import PublicNav from '@/components/public/public-nav'
import Footer from '@/components/public/footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}
