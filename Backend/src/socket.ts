import { Server as SocketServer } from 'socket.io';

let ioInstance: SocketServer | null = null;

/**
 * Stores the active Socket.IO server instance.
 * Decouples socket broadcasting from server startup to eliminate circular dependencies.
 */
export const setIO = (io: SocketServer): void => {
  ioInstance = io;
};

/**
 * Retrieves the active Socket.IO server instance, if initialized.
 */
export const getIO = (): SocketServer | null => {
  return ioInstance;
};
