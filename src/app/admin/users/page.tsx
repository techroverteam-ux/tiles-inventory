'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'

interface Customer {
	id: string
	email: string
	username: string
	name?: string | null
	phone?: string | null
	isActive: boolean
	createdAt: string
}

export default function AdminUsersPage() {
	const [customers, setCustomers] = useState<Customer[]>([])
	const [search, setSearch] = useState('')
	const [loading, setLoading] = useState(true)
	const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

	const fetchCustomers = async (query = '') => {
		setLoading(true)
		try {
			const response = await fetch(`/api/admin/customers?search=${encodeURIComponent(query)}`)
			const data = await response.json()
			setCustomers(data.customers || [])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchCustomers()
	}, [])

	const toggleStatus = async (customer: Customer) => {
		setActionLoadingId(customer.id)
		try {
			const response = await fetch(`/api/admin/customers/${customer.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ isActive: !customer.isActive }),
			})

			if (!response.ok) {
				throw new Error('Failed to update user')
			}

			setCustomers((prev) =>
				prev.map((item) =>
					item.id === customer.id ? { ...item, isActive: !item.isActive } : item
				)
			)
			toast.success(`User ${customer.isActive ? 'deactivated' : 'activated'}`)
		} catch {
			toast.error('Could not update user status')
		} finally {
			setActionLoadingId(null)
		}
	}

	const deleteUser = async (customer: Customer) => {
		const confirmed = window.confirm(`Delete customer ${customer.email}? This cannot be undone.`)
		if (!confirmed) return

		setActionLoadingId(customer.id)
		try {
			const response = await fetch(`/api/admin/customers/${customer.id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				throw new Error('Failed to delete user')
			}

			setCustomers((prev) => prev.filter((item) => item.id !== customer.id))
			toast.success('User deleted')
		} catch {
			toast.error('Could not delete user')
		} finally {
			setActionLoadingId(null)
		}
	}

	return (
		<div className="page-container space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-bold">Users</h1>
					<p className="text-sm text-muted-foreground">Manage website customers</p>
				</div>
				<div className="flex items-center gap-2">
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search users..."
						className="w-64"
					/>
					<Button onClick={() => fetchCustomers(search)}>Search</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Customer Accounts</CardTitle>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-sm text-muted-foreground">Loading users...</p>
					) : customers.length === 0 ? (
						<p className="text-sm text-muted-foreground">No users found.</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border text-left">
										<th className="py-2 pr-3">Name</th>
										<th className="py-2 pr-3">Username</th>
										<th className="py-2 pr-3">Email</th>
										<th className="py-2 pr-3">Phone</th>
										<th className="py-2 pr-3">Status</th>
										<th className="py-2 pr-3">Created</th>
										<th className="py-2 pr-3">Actions</th>
									</tr>
								</thead>
								<tbody>
									{customers.map((customer) => (
										<tr key={customer.id} className="border-b border-border/60">
											<td className="py-2 pr-3">{customer.name || '-'}</td>
											<td className="py-2 pr-3">{customer.username}</td>
											<td className="py-2 pr-3">{customer.email}</td>
											<td className="py-2 pr-3">{customer.phone || '-'}</td>
											<td className="py-2 pr-3">{customer.isActive ? 'Active' : 'Inactive'}</td>
											<td className="py-2 pr-3">{new Date(customer.createdAt).toLocaleDateString()}</td>
											<td className="py-2 pr-3">
												<div className="flex items-center gap-2">
													<Button
														size="sm"
														variant="outline"
														disabled={actionLoadingId === customer.id}
														onClick={() => toggleStatus(customer)}
													>
														{customer.isActive ? 'Deactivate' : 'Activate'}
													</Button>
													<Button
														size="sm"
														variant="destructive"
														disabled={actionLoadingId === customer.id}
														onClick={() => deleteUser(customer)}
													>
														Delete
													</Button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
