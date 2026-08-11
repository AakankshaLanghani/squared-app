import { useApp, computeBalances } from '../store'
import { PencilIcon } from '../components/icons'

export default function Profile() {
  const { user, groups, myMemberId } = useApp()

  let netOwed = 0
  let netOwe = 0
  groups.forEach((g) => {
    const mine = computeBalances(g)[myMemberId(g)] || 0
    if (mine > 0) netOwed += mine
    else netOwe += -mine
  })

  return (
    <div className="flex-1 flex flex-col">
      <div className="text-center pt-8 pb-2">
        <p className="text-xs font-medium text-black/40 tracking-wide uppercase">Profile</p>
      </div>

      <div className="flex flex-col items-center mt-3">
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{ background: 'var(--accent)' }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center border-2 border-[var(--surface)]">
            <PencilIcon />
          </span>
        </div>
        <p className="text-lg font-semibold mt-3">{user.name}</p>
      </div>

      <div className="px-5 mt-6">
        <div className="bg-white rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Personal info</h2>
          </div>
          <div className="flex flex-col gap-3.5">
            <Row label="Name" value={user.name} />
            <Row label="Phone number" value={user.phone || 'Not added'} />
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="bg-white rounded-3xl p-5">
          <h2 className="text-sm font-semibold mb-3">Account info</h2>
          <div className="flex justify-between">
            <div>
              <p className="text-[11px] text-black/40">Groups</p>
              <p className="font-semibold text-sm">{groups.length}</p>
            </div>
            <div>
              <p className="text-[11px] text-black/40">Owed to you</p>
              <p className="font-semibold text-sm text-green-600">Rs. {Math.round(netOwed)}</p>
            </div>
            <div>
              <p className="text-[11px] text-black/40">You owe</p>
              <p className="font-semibold text-sm" style={{ color: 'var(--danger)' }}>
                Rs. {Math.round(netOwe)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-6 pb-6">
        <button
          onClick={() => {
            const message =
              "This is a demo version — Squared doesn't have accounts yet.\n\n" +
              "Signing out will remove this device's link to your groups (your name, and which groups you're part of). " +
              "Your groups and expenses stay safe on the server, but you'll need to rejoin each group with its code to see them again.\n\n" +
              'Continue signing out?'
            if (confirm(message)) {
              localStorage.removeItem('squared_local')
              localStorage.removeItem('squared_groups_cache')
              window.location.reload()
            }
          }}
          className="w-full text-sm font-semibold px-5 py-3.5 rounded-2xl bg-white text-red-500"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-black/40">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
