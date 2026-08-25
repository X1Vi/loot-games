import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchCheapSharkDeals } from '../api/cheapshark'
import type { CheapSharkDeal } from '../types'

function DealCard({ deal }: { deal: CheapSharkDeal }) {
  const savings = Math.round(Number(deal.savings))
  const salePrice = Number(deal.salePrice)
  const normalPrice = Number(deal.normalPrice)

  return (
    <a
      href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block border p-3 transition-colors group"
      style={{
        borderColor: 'var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-bright)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)'
      }}
    >
      <div className="flex gap-3">
        {deal.thumb && (
          <img
            src={deal.thumb}
            alt={deal.title}
            className="w-16 h-9 object-cover border flex-shrink-0"
            style={{ borderColor: 'var(--border-subtle)' }}
            loading="lazy"
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className="text-sm font-mono truncate group-hover:underline"
            style={{ color: 'var(--fg-primary)' }}
          >
            {deal.title}
          </div>
          <div className="flex flex-wrap gap-2 mt-1 text-xs font-mono">
            <span
              className="px-1.5 py-0.5"
              style={{
                color: 'var(--fg-muted)',
                backgroundColor: 'var(--accent-bg)',
              }}
            >
              STORE {deal.storeID}
            </span>
            {deal.steamRatingPercent && Number(deal.steamRatingPercent) > 0 && (
              <span style={{ color: 'var(--fg-faint)' }}>
                {deal.steamRatingPercent}% ✓
              </span>
            )}
            {deal.metacriticScore && Number(deal.metacriticScore) > 0 && (
              <span style={{ color: 'var(--accent-yellow)' }}>
                MC {deal.metacriticScore}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs font-mono">
            <span style={{ color: 'var(--fg-primary)' }}>
              ${salePrice.toFixed(2)}
            </span>
            <span style={{ color: 'var(--fg-faint)', textDecoration: 'line-through' }}>
              ${normalPrice.toFixed(2)}
            </span>
            {savings > 0 && (
              <span style={{ color: 'var(--accent-green)' }}>
                -{savings}%
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  )
}

function Spinner() {
  return (
    <div
      className="flex items-center gap-2 font-mono text-sm py-8"
      style={{ color: 'var(--fg-muted)' }}
    >
      <span
        className="inline-block w-2 h-4 animate-pulse"
        style={{ backgroundColor: 'var(--fg-muted)' }}
      />
      <span>FETCHING DEALS</span>
    </div>
  )
}

function inputClasses() {
  return {
    backgroundColor: 'var(--input-bg)',
    borderColor: 'var(--border-mid)',
    color: 'var(--fg-primary)',
  } as React.CSSProperties
}

export function Deals() {
  const [sortBy, setSortBy] = useState('Deal Rating')
  const [maxPrice, setMaxPrice] = useState('15')
  const [minRating, setMinRating] = useState('0')
  const [page, setPage] = useState(0)

  const deals = useApi(
    () =>
      fetchCheapSharkDeals({
        pageNumber: page,
        pageSize: 30,
        sortBy,
        upperPrice: maxPrice ? Number(maxPrice) : undefined,
        steamRating: minRating ? Number(minRating) : undefined,
        onSale: 1,
      }),
    [sortBy, maxPrice, minRating, page],
  )

  return (
    <div className="p-4">
      <div className="mb-4 font-mono text-xs" style={{ color: 'var(--fg-faint)' }}>
        $ ./fetch_deals.sh --on-sale
      </div>

      <div
        className="flex flex-wrap gap-3 mb-4 p-3 border"
        style={{
          borderColor: 'var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
          SORT:
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setPage(0)
            }}
            className="px-2 py-1 text-xs font-mono border focus:outline-none cursor-pointer"
            style={{
              ...inputClasses(),
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-bright)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-mid)'
            }}
          >
            <option value="Deal Rating">Rating</option>
            <option value="Title">Title</option>
            <option value="Savings">Savings</option>
            <option value="Price">Price</option>
            <option value="Metacritic">Metacritic</option>
            <option value="Reviews">Reviews</option>
            <option value="Release">Release</option>
            <option value="Store">Store</option>
            <option value="recent">Recent</option>
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
          MAX $:
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value)
              setPage(0)
            }}
            className="px-2 py-1 w-20 text-xs font-mono border focus:outline-none"
            style={inputClasses()}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-bright)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-mid)'
            }}
          />
        </label>
        <label className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--fg-muted)' }}>
          RATING %:
          <input
            type="number"
            value={minRating}
            onChange={(e) => {
              setMinRating(e.target.value)
              setPage(0)
            }}
            className="px-2 py-1 w-16 text-xs font-mono border focus:outline-none"
            style={inputClasses()}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-bright)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-mid)'
            }}
          />
        </label>
        <button
          onClick={() => {
            setSortBy('Deal Rating')
            setMaxPrice('15')
            setMinRating('0')
            setPage(0)
          }}
          className="text-xs font-mono border px-2 py-1 transition-colors cursor-pointer"
          style={{
            color: 'var(--fg-dim)',
            borderColor: 'var(--border-mid)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--fg-primary)'
            e.currentTarget.style.borderColor = 'var(--border-bright)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--fg-dim)'
            e.currentTarget.style.borderColor = 'var(--border-mid)'
          }}
        >
          RESET
        </button>
      </div>

      {deals.loading ? (
        <Spinner />
      ) : deals.error ? (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--accent-red)' }}>
          ! ERR: {deals.error}
        </div>
      ) : !deals.data || deals.data.length === 0 ? (
        <div className="font-mono text-sm py-4" style={{ color: 'var(--fg-faint)' }}>
          No deals found matching filters
        </div>
      ) : (
        <>
          <div className="font-mono text-xs mb-2" style={{ color: 'var(--fg-faint)' }}>
            {deals.data.length} deals loaded (page {page})
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {deals.data.map((deal) => (
              <DealCard key={deal.dealID} deal={deal} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 mt-4 font-mono text-xs">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                color: 'var(--fg-dim)',
                borderColor: 'var(--border-mid)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                if (page > 0) {
                  e.currentTarget.style.color = 'var(--fg-primary)'
                  e.currentTarget.style.borderColor = 'var(--border-bright)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--fg-dim)'
                e.currentTarget.style.borderColor = 'var(--border-mid)'
              }}
            >
              &lt; PREV
            </button>
            <span style={{ color: 'var(--fg-faint)' }}>PAGE {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border transition-colors cursor-pointer"
              style={{
                color: 'var(--fg-dim)',
                borderColor: 'var(--border-mid)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--fg-primary)'
                e.currentTarget.style.borderColor = 'var(--border-bright)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--fg-dim)'
                e.currentTarget.style.borderColor = 'var(--border-mid)'
              }}
            >
              NEXT &gt;
            </button>
          </div>
        </>
      )}
    </div>
  )
}
