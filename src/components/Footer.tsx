interface FooterProps {
  currentPage: number
  totalPages: number
  isDesktop: boolean
  isBookOpen?: boolean
  onPrev?: () => void
  onNext?: () => void
  canPrev?: boolean
  canNext?: boolean
}

export default function Footer(_props: FooterProps): null {
  // All footer content removed (caption, page status, tip, Prev/Next)
  // so the footer has zero height and the book never shifts.
  return null
}
