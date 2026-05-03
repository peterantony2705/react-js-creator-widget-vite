
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Flex,
    Text,
    Input,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Image,
    IconButton,
    Heading,
    useToast,
    VStack,
    HStack,
    Spacer
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import { mockProducts, mockCustomers } from '../utils/mockData';
import { zohoService } from '../services/zoho';
import { FaBarcode, FaWallet, FaCheck, FaTrash } from 'react-icons/fa';

const Step1Scanner = ({ cart, setCart, onNext }) => {
    const [barcode, setBarcode] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const toast = useToast();
    // Mock Wallet Amount - In real app, this might come from a selected customer or global store state
    const [walletAmt, setWalletAmt] = useState(0);

    const totalItems = cart.reduce((acc, item) => acc + item.cartQty, 0);
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.cartQty), 0);

    const lastInputTime = useRef(Date.now());
    const isScanning = useRef(true);
    const scanTimer = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [cart]);

    const handleInputChange = (e) => {
        const val = e.target.value;
        const now = Date.now();
        const timeDiff = now - lastInputTime.current;
        lastInputTime.current = now;

        if (val.length <= 1) {
            isScanning.current = true;
        } else if (timeDiff > 50) {
            isScanning.current = false;
        }

        setBarcode(val);

        if (scanTimer.current) clearTimeout(scanTimer.current);

        scanTimer.current = setTimeout(() => {
            if (isScanning.current && val.length >= 3) {
                fetchProduct(val);
            }
        }, 200);
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        if (pasteData) {
            setBarcode(pasteData);
            fetchProduct(pasteData);
        }
    };

    const handleScan = async (e) => {
        if (e.key === 'Enter') {
            if (scanTimer.current) clearTimeout(scanTimer.current);
            if (barcode.trim()) {
                await fetchProduct(barcode);
            }
        }
    };

    const fetchProduct = async (sku) => {
        setLoading(true);
        try {
            const product = await zohoService.fetchProduct(sku);
            if (product) {
                addToCart({
                    sku: product.Barcode,
                    product: product.Item_Name,
                    price: parseFloat(product.Selling_Price || 0),
                    image: product.Image_URL,
                    tax: parseFloat(product.Tax_Rate || 0),
                    category: product.Category
                });
                toast({
                    title: "Product Added",
                    description: `${product.Item_Name} added to cart.`,
                    status: "success",
                    duration: 1000,
                    isClosable: true,
                    position: "top-right"
                });
            } else {
                toast({
                    title: "Product Not Found",
                    description: `No product found for SKU: ${sku}`,
                    status: "error",
                    duration: 2000,
                    isClosable: true,
                    position: "top-right"
                });
            }
        } catch (error) {
            console.error("Fetch Product Error:", error);
            toast({
                title: "Error",
                description: "Failed to fetch product from Zoho.",
                status: "error",
                duration: 2000,
                isClosable: true,
            });
        }
        setLoading(false);
        setBarcode('');
        if (inputRef.current) inputRef.current.focus();
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.sku === product.sku);
            if (existing) {
                return prev.map(item =>
                    item.sku === product.sku ? { ...item, cartQty: item.cartQty + 1 } : item
                );
            }
            return [{ ...product, cartQty: 1 }, ...prev];
        });
    };

    const removeFromCart = (sku) => {
        setCart(prev => prev.filter(item => item.sku !== sku));
    };

    const handleClear = () => {
        if (window.confirm("Are you sure you want to clear the cart?")) {
            setCart([]);
        }
    };

    return (
        <Box p={5}>
            {/* Header */}
            <Flex
                justifyContent="space-between"
                alignItems="center"
                mb={5}
                bg="blue.500"
                p={4}
                borderRadius="md"
                color="white"
                boxShadow="md"
            >
                <HStack spacing={8} minW="200px">
                    <VStack spacing={0} align="start">
                        <Text fontSize="xs" opacity={0.8}>Count</Text>
                        <Text fontWeight="bold" fontSize="2xl">{totalItems}</Text>
                    </VStack>
                    <VStack spacing={0} align="start">
                        <Text fontSize="xs" opacity={0.8}>Amount</Text>
                        <Text fontWeight="bold" fontSize="2xl">₹{totalAmount.toFixed(2)}</Text>
                    </VStack>
                    <VStack spacing={0} align="start">
                        <HStack><FaWallet size="12px" /> <Text fontSize="xs" opacity={0.8}>Wallet</Text></HStack>
                        <Text fontWeight="bold" fontSize="2xl" color="red.100">₹{walletAmt.toFixed(2)}</Text>
                    </VStack>
                </HStack>

                <Spacer />

                {/* Branding Right Side */}
                <Heading size="lg" letterSpacing="tight">Baby Island POS</Heading>
            </Flex>

            {/* Scanner Input */}
            <Flex mb={5} gap={4}>
                <Input
                    ref={inputRef}
                    value={barcode}
                    onChange={handleInputChange}
                    onKeyDown={handleScan}
                    onPaste={handlePaste}
                    placeholder="Scan Barcode / SKU (Enter)"
                    size="lg"
                    autoFocus
                    flex={2}
                    bg="white"
                    borderColor="gray.300"
                    _hover={{ borderColor: "blue.400" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                />
                <Button
                    isDisabled={cart.length === 0}
                    colorScheme="red"
                    onClick={handleClear}
                    size="lg"
                    leftIcon={<FaTrash />}
                >
                    Clear
                </Button>
                <Button
                    isDisabled={cart.length === 0}
                    colorScheme="blue"
                    onClick={onNext}
                    size="lg"
                    leftIcon={<FaCheck />}
                >
                    Confirm
                </Button>
            </Flex>

            {/* Cart Table */}
            <Box overflowX="auto" border="1px" borderColor="gray.200" borderRadius="md" bg="white" shadow="sm">
                <Table variant="simple">
                    <Thead bg="gray.50">
                        <Tr>
                            <Th>#</Th>
                            <Th>Image</Th>
                            <Th>SKU</Th>
                            <Th>Product</Th>
                            <Th isNumeric>Price</Th>
                            <Th isNumeric>Qty</Th>
                            <Th isNumeric>Amount</Th>
                            <Th>Remove</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {cart.length === 0 ? (
                            <Tr>
                                <Td colspan={8} textAlign="center" py={10}>
                                    <VStack spacing={3} color="gray.400">
                                        <FaBarcode size="40px" />
                                        <Text>Scan items to begin</Text>
                                    </VStack>
                                </Td>
                            </Tr>
                        ) : (
                            cart.map((item, index) => (
                                <Tr key={item.sku} _hover={{ bg: "gray.50" }}>
                                    <Td>{index + 1}</Td>
                                    <Td>
                                        <Image
                                            src={item.image}
                                            boxSize="40px"
                                            borderRadius="md"
                                            objectFit="cover"
                                            fallbackSrc="https://via.placeholder.com/40"
                                        />
                                    </Td>
                                    <Td fontWeight="medium">{item.sku}</Td>
                                    <Td>{item.product}</Td>
                                    <Td isNumeric>₹{item.price.toFixed(2)}</Td>
                                    <Td isNumeric>{item.cartQty}</Td>
                                    <Td isNumeric fontWeight="bold">₹{(item.price * item.cartQty).toFixed(2)}</Td>
                                    <Td>
                                        <IconButton
                                            icon={<DeleteIcon />}
                                            colorScheme="red"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFromCart(item.sku)}
                                            aria-label="Remove Item"
                                        />
                                    </Td>
                                </Tr>
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>
        </Box>
    );
};

export default Step1Scanner;
