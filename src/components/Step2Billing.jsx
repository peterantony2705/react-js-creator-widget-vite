
import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    Button,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    IconButton,
    Heading,
    useToast,
    VStack,
    HStack,
    Input,
    Select,
    FormControl,
    FormLabel,
    InputGroup,
    InputRightElement,
    Divider,
    Badge,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    List,
    ListItem,
    Checkbox,
    Stack,
    Tooltip
} from '@chakra-ui/react';
import { AddIcon, MinusIcon, SearchIcon, CheckIcon } from '@chakra-ui/icons';
import { mockCustomers, mockDiscounts } from '../utils/mockData';
import { zohoService } from '../services/zoho';
import { calculateTotals, formatCurrency, getBestDiscount } from '../utils/calculations';

const Step2Billing = ({ cart, setCart, onBack, onComplete }) => {
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [discount, setDiscount] = useState(null);

    // Payment States
    const [paymentModes, setPaymentModes] = useState({
        Cash: false,
        Card: false,
        UPI: false
    });
    const [paymentAmounts, setPaymentAmounts] = useState({
        Cash: "",
        Card: "",
        UPI: ""
    });

    const [totals, setTotals] = useState({});
    const toast = useToast();

    // New Customer Modal
    const { isOpen, onOpen, onClose } = useDisclosure();
    // Confirmation Modal
    const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();
    // Success Modal
    const { isOpen: isSuccessOpen, onOpen: onSuccessOpen, onClose: onSuccessClose } = useDisclosure();

    const initialCustomerState = { firstName: '', lastName: '', phone: '+91', email: '', numberOfChildren: '', children: [] };
    const [newCustomer, setNewCustomer] = useState(initialCustomerState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCloseModal = () => {
        setNewCustomer(initialCustomerState);
        onClose();
    };

    // Calculate Totals on Cart or Discount Change
    useEffect(() => {
        const newTotals = calculateTotals(cart, discount);
        setTotals(newTotals);
    }, [cart, discount]);

    // Customer Search Logic
    const handleCustomerSearch = (e) => {
        const query = e.target.value;
        setCustomerSearch(query);

        if (query.length > 2) {
            zohoService.fetchCustomers(query).then(customers => {
                setCustomerResults(customers.map(c => ({
                    id: c.ID,
                    name: c.Name_Str || (c.Name ? c.Name.display_value : ""),
                    phone: c.Phone_Number,
                    wallet: parseFloat(c.Wallet_Balance || 0)
                })));
            }).catch(err => {
                console.error("Customer Search Error:", err);
            });
        } else {
            setCustomerResults([]);
        }
    };

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch('');
        setCustomerResults([]);
        toast({ title: "Customer Selected", status: "info", duration: 1000 });
    };

    const handleAddCustomer = () => {
        // Basic Validation
        if (!newCustomer.firstName || !newCustomer.phone) {
            toast({ title: "Error", description: "Name and Phone are required", status: "error" });
            return;
        }

        setIsSubmitting(true);
        zohoService.createCustomer({
            First_Name: newCustomer.firstName,
            Last_Name: newCustomer.lastName,
            Phone_Number: newCustomer.phone,
            Email: newCustomer.email,
            children: newCustomer.children
        }).then(response => {
            const customer = {
                id: response.ID,
                name: `${newCustomer.firstName} ${newCustomer.lastName}`,
                phone: newCustomer.phone,
                wallet: 0
            };
            setSelectedCustomer(customer);
            handleCloseModal();
            toast({ title: "Customer Created in Zoho", status: "success" });
        }).catch(err => {
            console.error("Create Customer Error:", err);
            toast({ title: "Error", description: "Failed to create customer in Zoho", status: "error" });
        }).finally(() => setIsSubmitting(false));
    };

    // Discount Logic - Manual Trigger based on criteria
    const checkDiscounts = () => {
        zohoService.getDiscounts().then(discounts => {
            // Basic implementation: find best applicable discount from Zoho list
            const purchase = {
                amount: totals.eligibleSubTotal,
                branchId: "STORE001", // Should ideally come from context
                brand: cart[0]?.brand || "",
                productCreatedAt: cart[0]?.createdAt || "2024-01-01"
            };

            const bestDiscount = getBestDiscount(discounts, purchase);
            if (bestDiscount) {
                setDiscount(bestDiscount);
                toast({ title: "Discount Applied", description: `Applied ${bestDiscount.Name}`, status: "success" });
            } else {
                setDiscount(null);
                toast({ title: "No applicable discount found", status: "warning" });
            }
        }).catch(err => {
            console.error("Fetch Discounts Error:", err);
            toast({ title: "Error", description: "Failed to fetch discounts from Zoho", status: "error" });
        });
    };

    const handlePaymentModeChange = (mode) => {
        setPaymentModes(prev => ({ ...prev, [mode]: !prev[mode] }));
        // Reset amount if unchecked
        if (paymentModes[mode]) {
            setPaymentAmounts(prev => ({ ...prev, [mode]: "" }));
        }
    };

    const handlePaymentAmountChange = (mode, value) => {
        setPaymentAmounts(prev => ({ ...prev, [mode]: value }));
    };

    const handlePaymentSubmit = () => {
        if (!selectedCustomer) {
            toast({ title: "Validation Error", description: "Please select a customer", status: "error" });
            return;
        }

        // Check if at least one mode selected
        const selectedModes = Object.keys(paymentModes).filter(k => paymentModes[k]);
        if (selectedModes.length === 0) {
            toast({ title: "Validation Error", description: "Please select at least one payment mode", status: "error" });
            return;
        }

        // Validate Amounts
        let totalPaid = 0;
        selectedModes.forEach(mode => {
            totalPaid += parseFloat(paymentAmounts[mode] || 0);
        });

        if (Math.abs(totalPaid - totals.netTotal) > 0.01) { // Floating point tolerance
            toast({ title: "Validation Error", description: `Payment amount (${totalPaid}) must match Net Total (${totals.netTotal})`, status: "error" });
            return;
        }

        onConfirmOpen();
    };

    const handleConfirmOrder = () => {
        setIsSubmitting(true);

        zohoService.createSalesOrder({
            Customer_Name: selectedCustomer.id,
            Sales_Items: cart.map(item => ({
                Barcode: item.sku,
                Quantity: item.cartQty,
                Rate: item.price,
                Amount: item.price * item.cartQty
            })),
            Net_Total: totals.netTotal,
            Paid_Amount: totals.netTotal,
            Payment_Type: Object.keys(paymentModes).filter(k => paymentModes[k]).join(', ')
        }).then(response => {
            setIsSubmitting(false);
            onConfirmClose();
            onSuccessOpen();
            toast({ title: "Order Created", status: "success" });
        }).catch(err => {
            console.error("Create Order Error:", err);
            setIsSubmitting(false);
            toast({ title: "Error", description: "Failed to submit order to Zoho", status: "error" });
        });
    };

    const finalizeOrder = () => {
        onSuccessClose();
        onComplete();
    }

    return (
        <Box p={5}>
            {/* Header */}
            <Flex justifyContent="space-between" alignItems="center" mb={5} bg="blue.600" p={4} borderRadius="md" color="white">
                <Heading size="md">Confirm Bill</Heading>
                <HStack>
                    {selectedCustomer ? (
                        <Badge colorScheme="green" fontSize="md" p={2} borderRadius="full" display="flex" alignItems="center">
                            {selectedCustomer.name} ({selectedCustomer.phone})
                            <IconButton
                                icon={<MinusIcon />}
                                size="xs"
                                ml={2}
                                rounded="full"
                                colorScheme="red"
                                onClick={() => setSelectedCustomer(null)}
                            />
                        </Badge>
                    ) : (
                        <Box position="relative">
                            <InputGroup size="sm" bg="white" borderRadius="md" w="300px">
                                <Input
                                    placeholder="Search Customer (Phone/Name)"
                                    color="black"
                                    value={customerSearch}
                                    onChange={handleCustomerSearch}
                                />
                                <InputRightElement><SearchIcon color="gray.500" /></InputRightElement>
                            </InputGroup>
                            {customerSearch.length > 0 && (
                                <List position="absolute" top="100%" left={0} right={0} bg="white" color="black" shadow="md" borderRadius="md" zIndex={10} maxH="200px" overflowY="auto">
                                    {customerResults.length > 0 ? (
                                        customerResults.map(c => (
                                            <ListItem key={c.id} p={2} _hover={{ bg: "gray.100", cursor: "pointer" }} onClick={() => selectCustomer(c)}>
                                                <Text fontWeight="bold">{c.name}</Text>
                                                <Text fontSize="xs">{c.phone}</Text>
                                            </ListItem>
                                        ))
                                    ) : (
                                        <ListItem p={2}>
                                            <Text color="gray.500" fontSize="sm">No results found</Text>
                                        </ListItem>
                                    )}
                                </List>
                            )}
                        </Box>
                    )}
                    <Button size="sm" onClick={onOpen} colorScheme="teal" variant="solid" leftIcon={<AddIcon />}>
                        New Customer
                    </Button>
                </HStack>
            </Flex>

            <Flex gap={5} flexDirection={{ base: "column", lg: "row" }}>
                {/* Cart Items */}
                <Box flex={2} overflowX="auto" border="1px" borderColor="gray.200" borderRadius="md" p={2} maxH="60vh" overflowY="auto">
                    <Table variant="simple" size="sm">
                        <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
                            <Tr>
                                <Th>SKU</Th>
                                <Th>Product</Th>
                                <Th isNumeric>Price</Th>
                                <Th textAlign="center">Qty</Th>
                                <Th isNumeric>Total</Th>
                                <Th>Action</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {cart.map((item) => (
                                <Tr key={item.sku}>
                                    <Td fontSize="sm">{item.sku}</Td>
                                    <Td fontWeight="bold">{item.product}</Td>
                                    <Td isNumeric>{formatCurrency(item.price)}</Td>
                                    <Td textAlign="center">
                                        <HStack justify="center">
                                            <IconButton
                                                icon={<MinusIcon />}
                                                size="xs"
                                                onClick={() => {
                                                    setCart(prev => prev.map(p => p.sku === item.sku ? { ...p, cartQty: Math.max(1, p.cartQty - 1) } : p));
                                                }}
                                            />
                                            <Text w="30px" textAlign="center">{item.cartQty}</Text>
                                            <IconButton
                                                icon={<AddIcon />}
                                                size="xs"
                                                onClick={() => {
                                                    setCart(prev => prev.map(p => p.sku === item.sku ? { ...p, cartQty: p.cartQty + 1 } : p));
                                                }}
                                            />
                                        </HStack>
                                    </Td>
                                    <Td isNumeric>{formatCurrency(item.price * item.cartQty)}</Td>
                                    <Td>
                                        <Button size="xs" colorScheme="red" variant="ghost" onClick={() => setCart(prev => prev.filter(p => p.sku !== item.sku))}>
                                            Remove
                                        </Button>
                                    </Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </Box>

                {/* Pricing & Payment */}
                <Box flex={1} border="1px" borderColor="gray.200" borderRadius="md" p={5} bg="gray.50" h="fit-content">
                    <VStack spacing={3} align="stretch">
                        <HStack justify="space-between">
                            <Text color="gray.600">Total Pcs</Text>
                            <Text fontWeight="bold">{totals.totalQty}</Text>
                        </HStack>
                        <HStack justify="space-between">
                            <Text color="gray.600">Subtotal</Text>
                            <Text fontWeight="bold">{formatCurrency(totals.subTotal || 0)}</Text>
                        </HStack>

                        <HStack justify="space-between" alignItems="flex-start">
                            <Tooltip label={[
                                totals.taxAmt_5 > 0 ? `5%: ${formatCurrency(totals.taxAmt_5)}` : '',
                                totals.taxAmt_12 > 0 ? `12%: ${formatCurrency(totals.taxAmt_12)}` : '',
                                totals.taxAmt_18 > 0 ? `18%: ${formatCurrency(totals.taxAmt_18)}` : ''
                            ].filter(Boolean).join(' | ')} hasArrow placement="top">
                                <VStack align="flex-start" spacing={0}>
                                    <Text color="gray.600" borderBottom="1px dashed" borderColor="gray.400" cursor="help">Total Tax</Text>
                                    <Text fontSize="xs" color="gray.400">
                                        {totals.taxAmt_5 > 0 && ` 5% `}
                                        {totals.taxAmt_12 > 0 && ` 12% `}
                                        {totals.taxAmt_18 > 0 && ` 18% `}
                                    </Text>
                                </VStack>
                            </Tooltip>
                            <VStack align="flex-end" spacing={0}>
                                <Text>{formatCurrency(totals.totalTax || 0)}</Text>
                                <Text fontSize="xs" color="gray.400">
                                    {totals.taxAmt_5 > 0 && `${formatCurrency(totals.taxAmt_5)} `}
                                    {totals.taxAmt_12 > 0 && `+ ${formatCurrency(totals.taxAmt_12)} `}
                                    {totals.taxAmt_18 > 0 && `+ ${formatCurrency(totals.taxAmt_18)} `}
                                </Text>
                            </VStack>
                        </HStack>

                        {discount ? (
                            <Box bg="green.50" p={2} borderRadius="md" border="1px dashed" borderColor="green.200">
                                <HStack justify="space-between">
                                    <Text color="green.600" fontSize="sm">Discount ({totals.discountName})</Text>
                                    <Text color="green.600" fontWeight="bold">-{formatCurrency(totals.discountAmt || 0)}</Text>
                                </HStack>
                            </Box>
                        ) : (
                            <Button size="xs" onClick={checkDiscounts} colorScheme="orange" variant="outline" w="full">
                                Check Discounts
                            </Button>
                        )}

                        <Divider />
                        <HStack justify="space-between" bg="blue.50" p={2} borderRadius="md">
                            <Text fontSize="lg" fontWeight="bold">Net Total</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">{formatCurrency(totals.netTotal || 0)}</Text>
                        </HStack>

                        <Box mt={2}>
                            <Text fontWeight="bold" mb={2}>Mode of Payment</Text>
                            <Stack spacing={2}>
                                {['Cash', 'Card', 'UPI'].map(mode => (
                                    <Box key={mode}>
                                        <Checkbox
                                            isChecked={paymentModes[mode]}
                                            onChange={() => handlePaymentModeChange(mode)}
                                        >
                                            {mode}
                                        </Checkbox>
                                        {paymentModes[mode] && (
                                            <Input
                                                mt={1}
                                                size="sm"
                                                type="number"
                                                placeholder={`Enter ${mode} Amount`}
                                                value={paymentAmounts[mode]}
                                                onChange={(e) => handlePaymentAmountChange(mode, e.target.value)}
                                            />
                                        )}
                                    </Box>
                                ))}
                            </Stack>
                        </Box>

                        <VStack pt={4} w="full">
                            <Button colorScheme="blue" w="full" size="lg" onClick={handlePaymentSubmit}>
                                Submit Order
                            </Button>
                            <Button variant="ghost" w="full" onClick={onBack}>
                                Back to Scan
                            </Button>
                        </VStack>

                    </VStack>
                </Box>
            </Flex>

            {/* Add Customer Modal */}
            <Modal isOpen={isOpen} onClose={handleCloseModal} size="4xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add New Customer</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack spacing={4}>
                            <HStack w="full">
                                <FormControl isRequired>
                                    <FormLabel>First Name</FormLabel>
                                    <Input value={newCustomer.firstName} onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })} />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Last Name</FormLabel>
                                    <Input value={newCustomer.lastName} onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })} />
                                </FormControl>
                            </HStack>
                            <HStack w="full">
                                <FormControl isRequired>
                                    <FormLabel>Phone Number</FormLabel>
                                    <Input
                                        value={newCustomer.phone}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (!val.startsWith('+91')) {
                                                val = '+91';
                                            }
                                            // Allow only digits after +91
                                            const numberPart = val.substring(3).replace(/[^0-9]/g, '');
                                            // Limit to 10 digits
                                            const truncatedNum = numberPart.substring(0, 10);
                                            const finalPhone = '+91' + truncatedNum;

                                            setNewCustomer(prev => ({ ...prev, phone: finalPhone }));

                                            // Auto-fetch logic
                                            if (truncatedNum.length === 10) {
                                                const existing = mockCustomers.find(c => c.phone === truncatedNum);
                                                if (existing) {
                                                    const nameParts = existing.name.split(' ');
                                                    setNewCustomer(prev => ({
                                                        ...prev,
                                                        phone: finalPhone,
                                                        firstName: nameParts[0] || '',
                                                        lastName: nameParts.slice(1).join(' ') || '',
                                                        email: existing.email || '',
                                                        numberOfChildren: existing.children ? existing.children.length : 0,
                                                        children: existing.children ? JSON.parse(JSON.stringify(existing.children)) : []
                                                    }));
                                                    toast({ title: "Customer Found", status: "success", duration: 2000 });
                                                }
                                            }
                                        }}
                                        placeholder="+91 Followed by 10 Digits"
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel>Email</FormLabel>
                                    <Input value={newCustomer.email} onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })} />

                                </FormControl>

                            </HStack>
                            <HStack w="full">
                                <FormControl >
                                    <FormLabel>Number of Children</FormLabel>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={newCustomer.numberOfChildren}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const count = val === '' ? 0 : parseInt(val);
                                            setNewCustomer(prev => {
                                                const currentChildren = [...prev.children];
                                                if (count > currentChildren.length) {
                                                    // Add rows
                                                    const rowsToAdd = count - currentChildren.length;
                                                    for (let i = 0; i < rowsToAdd; i++) {
                                                        currentChildren.push({ name: '', dob: '', gender: 'Boy' });
                                                    }
                                                } else if (count < currentChildren.length) {
                                                    // Remove rows
                                                    currentChildren.splice(count);
                                                }
                                                return { ...prev, numberOfChildren: val, children: currentChildren };
                                            });
                                        }}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormLabel></FormLabel>
                                </FormControl>
                            </HStack>
                            {newCustomer.numberOfChildren > 0 && (
                                <Box w="full" border="1px" borderColor="gray.200" p={3} borderRadius="md" bg="gray.50">
                                    <Flex justify="space-between" align="center" mb={3}>
                                        <Text fontWeight="bold">Children Details</Text>
                                        <Button
                                            size="sm"
                                            leftIcon={<AddIcon />}
                                            onClick={() => {
                                                setNewCustomer(prev => {
                                                    const newChildren = [...prev.children, { name: '', dob: '', gender: 'Boy' }];
                                                    return { ...prev, numberOfChildren: newChildren.length, children: newChildren };
                                                });
                                            }}
                                        >
                                            Add Child
                                        </Button>
                                    </Flex>
                                    <VStack spacing={3}>
                                        {newCustomer.children.map((child, index) => (
                                            <HStack key={index} w="full" spacing={3} align="flex-end">
                                                <Text fontWeight="bold" fontSize="sm" w="20px">{index + 1}.</Text>
                                                <FormControl isRequired>
                                                    <FormLabel fontSize="xs">Name</FormLabel>
                                                    <Input
                                                        size="sm"
                                                        value={child.name}
                                                        onChange={(e) => {
                                                            const newChildren = [...newCustomer.children];
                                                            newChildren[index].name = e.target.value;
                                                            setNewCustomer(prev => ({ ...prev, children: newChildren }));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormControl >
                                                    <FormLabel fontSize="xs">DOB</FormLabel>
                                                    <Input
                                                        size="sm"
                                                        type="date"
                                                        value={child.dob}
                                                        onChange={(e) => {
                                                            const newChildren = [...newCustomer.children];
                                                            newChildren[index].dob = e.target.value;
                                                            setNewCustomer(prev => ({ ...prev, children: newChildren }));
                                                        }}
                                                    />
                                                </FormControl>
                                                <FormControl w="xs" isRequired>
                                                    <FormLabel fontSize="xs">Gender</FormLabel>
                                                    <Select
                                                        size="sm"
                                                        value={child.gender}
                                                        onChange={(e) => {
                                                            const newChildren = [...newCustomer.children];
                                                            newChildren[index].gender = e.target.value;
                                                            setNewCustomer(prev => ({ ...prev, children: newChildren }));
                                                        }}
                                                    >
                                                        <option value="Boy">Boy</option>
                                                        <option value="Girl">Girl</option>
                                                    </Select>
                                                </FormControl>
                                                <IconButton
                                                    size="sm"
                                                    icon={<MinusIcon />}
                                                    colorScheme="red"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setNewCustomer(prev => {
                                                            const newChildren = prev.children.filter((_, i) => i !== index);
                                                            return { ...prev, numberOfChildren: newChildren.length, children: newChildren };
                                                        });
                                                    }}
                                                />
                                            </HStack>
                                        ))}

                                    </VStack>
                                </Box>
                            )}
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={handleAddCustomer}>Save Customer</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Confirmation Dialog */}
            <Modal isOpen={isConfirmOpen} onClose={onConfirmClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirm Order</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack align="stretch" spacing={3}>
                            <Text>Are you sure you want to place this order?</Text>
                            <Divider />
                            <HStack justify="space-between">
                                <Text color="gray.600">Customer:</Text>
                                <Text fontWeight="bold">{selectedCustomer?.name}</Text>
                            </HStack>
                            <HStack justify="space-between">
                                <Text color="gray.600">Total Amount:</Text>
                                <Text fontWeight="bold">{formatCurrency(totals.netTotal || 0)}</Text>
                            </HStack>
                            <Box>
                                <Text fontSize="sm" color="gray.500">Payment:</Text>
                                {Object.keys(paymentModes).filter(k => paymentModes[k]).map(mode => (
                                    <Text key={mode} fontSize="sm" ml={2}>- {mode}: {formatCurrency(paymentAmounts[mode])}</Text>
                                ))}
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={onConfirmClose} isDisabled={isSubmitting}>Cancel</Button>
                        <Button colorScheme="blue" onClick={handleConfirmOrder} isLoading={isSubmitting} loadingText="Submitting...">Confirm</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Success Dialog */}
            <Modal isOpen={isSuccessOpen} onClose={onSuccessClose} isCentered closeOnOverlayClick={false}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader bg="green.500" color="white" borderTopRadius="md">Order Successful</ModalHeader>
                    <ModalBody py={6}>
                        <VStack spacing={4}>
                            <CheckIcon boxSize="50px" color="green.500" />
                            <Heading size="md">Order Placed Successfully!</Heading>
                            <Text>Customer: {selectedCustomer?.name}</Text>
                            <Text fontWeight="bold" fontSize="xl">Total: {formatCurrency(totals.netTotal || 0)}</Text>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={finalizeOrder} w="full">Done</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

        </Box >
    );
};

export default Step2Billing;
