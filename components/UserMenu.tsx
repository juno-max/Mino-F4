'use client'

import { Fragment, useState, useEffect } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import {
  UserCircleIcon,
  KeyIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  EyeSlashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

export default function UserMenu() {
  const { data: session } = useSession()
  const [stealthMode, setStealthMode] = useState(false)

  // Load stealth mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('stealthMode')
    if (saved) {
      setStealthMode(JSON.parse(saved))
      applyStealthMode(JSON.parse(saved))
    }
  }, [])

  const toggleStealthMode = () => {
    const newValue = !stealthMode
    setStealthMode(newValue)
    localStorage.setItem('stealthMode', JSON.stringify(newValue))
    applyStealthMode(newValue)
  }

  const applyStealthMode = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add('stealth-mode')
      // Hide sensitive data classes
      document.querySelectorAll('.sensitive-data').forEach((el) => {
        el.classList.add('blur-sm')
      })
    } else {
      document.documentElement.classList.remove('stealth-mode')
      document.querySelectorAll('.sensitive-data').forEach((el) => {
        el.classList.remove('blur-sm')
      })
    }
  }

  if (!session) {
    return null
  }

  const user = session.user

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || 'User'}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <div className="text-left hidden md:block">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="p-2">
            {/* User Info */}
            <div className="px-3 py-2 border-b border-gray-100 mb-2">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            {/* Profile */}
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/account/profile"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md`}
                >
                  <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Profile Settings
                </Link>
              )}
            </Menu.Item>

            {/* API Keys */}
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/account/api-keys"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md`}
                >
                  <KeyIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  API Keys
                </Link>
              )}
            </Menu.Item>

            {/* Organization Settings */}
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/account/organization"
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } group flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-md`}
                >
                  <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                  Organization
                </Link>
              )}
            </Menu.Item>

            {/* Stealth Mode Toggle */}
            <div className="border-t border-gray-100 mt-2 pt-2">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={toggleStealthMode}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } group flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 rounded-md`}
                  >
                    <div className="flex items-center">
                      {stealthMode ? (
                        <EyeSlashIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      ) : (
                        <EyeIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      )}
                      Stealth Mode
                    </div>
                    <div
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        stealthMode ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          stealthMode ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  </button>
                )}
              </Menu.Item>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 mt-2 pt-2">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className={`${
                      active ? 'bg-red-50' : ''
                    } group flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-md`}
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-red-500" />
                    Sign Out
                  </button>
                )}
              </Menu.Item>
            </div>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
