import {Fragment, useState} from 'react';
import {Dialog, Transition} from '@headlessui/react';

import {Heading} from '~/components/Text';
import {IconClose} from '~/components/Icon';

/**
 * Redesigned Drawer component with premium modern UI.
 * @param heading - string. Shown at the top of the drawer.
 * @param open - boolean state. if true opens the drawer.
 * @param onClose - function should set the open state.
 * @param openFrom - right, left
 * @param children - react children node.
 */
export function Drawer({
  heading,
  open,
  onClose,
  openFrom = 'right',
  children,
}: {
  heading?: string;
  open: boolean;
  onClose: () => void;
  openFrom: 'right' | 'left';
  children: React.ReactNode;
}) {
  const offScreen = {
    right: 'translate-x-full',
    left: '-translate-x-full',
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-400"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`fixed inset-y-0 flex max-w-full ${
                openFrom === 'right' ? 'right-0' : ''
              }`}
            >
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-[cubic-bezier(0.32,0.72,0,1)] duration-500"
                enterFrom={offScreen[openFrom]}
                enterTo="translate-x-0"
                leave="transform transition ease-[cubic-bezier(0.32,0.72,0,1)] duration-400"
                leaveFrom="translate-x-0"
                leaveTo={offScreen[openFrom]}
              >
                <Dialog.Panel className="w-screen max-w-[420px] h-screen-dynamic flex flex-col bg-white shadow-2xl">
                  {/* Header */}
                  <header
                    className="flex-shrink-0 flex items-center px-5 py-4 border-b border-neutral-100 bg-white"
                    style={{minHeight: '64px'}}
                  >
                    {heading !== null && (
                      <Dialog.Title className="flex-1">
                        <div className="flex items-center gap-2.5">
                          {/* Shopping bag icon */}
                          <div className="w-8 h-8 rounded-lg bg-[#D33E13]/10 flex items-center justify-center flex-shrink-0">
                            <svg
                              className="w-4 h-4 text-[#D33E13]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                              />
                            </svg>
                          </div>
                          <span
                            className="text-base font-extrabold uppercase tracking-widest text-neutral-800"
                            id="cart-contents"
                          >
                            {heading}
                          </span>
                        </div>
                      </Dialog.Title>
                    )}
                    <button
                      type="button"
                      className="ml-auto p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all duration-200 flex items-center justify-center"
                      onClick={onClose}
                      data-test="close-cart"
                      aria-label="Close panel"
                    >
                      <IconClose aria-label="Close panel" />
                    </button>
                  </header>
                  {children}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/* Use for associating arialabelledby with the title*/
Drawer.Title = Dialog.Title;

export function useDrawer(openDefault = false) {
  const [isOpen, setIsOpen] = useState(openDefault);

  function openDrawer() {
    setIsOpen(true);
  }

  function closeDrawer() {
    setIsOpen(false);
  }

  return {
    isOpen,
    openDrawer,
    closeDrawer,
  };
}
