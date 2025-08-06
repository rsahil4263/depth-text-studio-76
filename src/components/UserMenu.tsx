import React, { useState, useRef, useEffect } from 'react';

interface UserMenuProps {
  className?: string;
  position?: 'top-right' | 'top-left' | 'b